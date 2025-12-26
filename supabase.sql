-- Fermi Competition Schema (Duolingo-style)
-- Run this in your Supabase SQL editor

-- =====================================================
-- STEP 1: Drop existing objects (clean slate)
-- =====================================================
drop view if exists public.student_scores cascade;
drop table if exists public.answers cascade;
drop table if exists public.student_exam_sessions cascade;
drop table if exists public.students cascade;
drop table if exists public.class_questions cascade;
drop table if exists public.classes cascade;
drop table if exists public.fermi_questions cascade;
drop function if exists public.set_updated_at cascade;
drop function if exists public.seed_class_questions cascade;

-- =====================================================
-- STEP 2: Create fermi_questions (system-provided)
-- =====================================================
create table public.fermi_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  correct_value double precision not null,
  hint text,
  difficulty int not null default 1 check (difficulty between 1 and 5),
  category text not null default 'general',
  "order" int not null unique,
  created_at timestamptz not null default now()
);

-- Insert 10 default Fermi questions
insert into public.fermi_questions (prompt, correct_value, hint, difficulty, category, "order") values
  ('How many heartbeats does a person have in one day?', 100000, 'Think about beats per minute and hours in a day', 2, 'biology', 1),
  ('How many kilometers of blood vessels are in the human body?', 100000, 'Consider all arteries, veins, and capillaries', 4, 'biology', 2),
  ('How many piano tuners are there in Chicago?', 225, 'Think about population, pianos per household, tunings per year', 3, 'estimation', 3),
  ('How many golf balls can fit in a school bus?', 500000, 'Estimate bus volume and golf ball diameter', 3, 'geometry', 4),
  ('How many liters of water does a person drink in a lifetime?', 60000, 'Consider average daily intake and lifespan', 2, 'biology', 5),
  ('How many atoms are in a grain of sand?', 50000000000000000000, 'Think about the mass of silicon and oxygen atoms', 5, 'physics', 6),
  ('How many hairs are on an average human head?', 100000, 'Consider hair density and scalp area', 2, 'biology', 7),
  ('How many words does the average person speak in a day?', 16000, 'Think about waking hours and speaking rate', 2, 'daily-life', 8),
  ('How many leaves are on a mature oak tree?', 250000, 'Estimate branches and leaves per branch', 3, 'nature', 9),
  ('How many pizzas are consumed in the United States each year?', 3000000000, 'Consider population and frequency of pizza eating', 3, 'daily-life', 10);

-- =====================================================
-- STEP 3: Create classes table
-- =====================================================
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  school_name text,
  num_students int not null check (num_students > 0 and num_students <= 500),
  competition_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================
-- STEP 4: Create students table
-- =====================================================
create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  username text not null,
  password_hash text not null,
  plain_password text, -- Stored temporarily for teacher to share
  full_name text,
  has_completed_exam boolean not null default false,
  first_login_at timestamptz,
  created_at timestamptz not null default now(),
  unique(class_id, username)
);

-- =====================================================
-- STEP 5: Create class_questions (links class to fermi questions)
-- =====================================================
create table public.class_questions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  fermi_question_id uuid not null references public.fermi_questions(id) on delete cascade,
  "order" int not null,
  created_at timestamptz not null default now(),
  unique(class_id, "order"),
  unique(class_id, fermi_question_id)
);

-- =====================================================
-- STEP 6: Create student_exam_sessions table
-- =====================================================
create table public.student_exam_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '40 minutes'),
  submitted_at timestamptz,
  unique(student_id)
);

-- =====================================================
-- STEP 7: Create answers table
-- =====================================================
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_question_id uuid not null references public.class_questions(id) on delete cascade,
  value double precision not null,
  confidence_pct int not null check (confidence_pct in (10,30,50,70,90)),
  is_teacher_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, class_question_id)
);

-- =====================================================
-- STEP 8: Create updated_at trigger
-- =====================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger trg_answers_updated before update on public.answers
for each row execute function public.set_updated_at();

-- =====================================================
-- STEP 9: Create scoring view
-- =====================================================
create or replace view public.student_scores as
select
  s.id as student_id,
  s.class_id,
  s.username,
  s.full_name,
  s.has_completed_exam,
  count(a.id) as total_answered,
  count(*) filter (
    where fq.correct_value is not null
      and a.value between (fq.correct_value * 0.5) and (fq.correct_value * 2)
  ) as correct_count,
  round(
    case
      when count(a.id) > 0 then
        (count(*) filter (
          where fq.correct_value is not null
            and a.value between (fq.correct_value * 0.5) and (fq.correct_value * 2)
        )::numeric / count(a.id)::numeric) * 100
      else 0
    end, 1
  ) as score_percentage
from public.students s
left join public.answers a on a.student_id = s.id
left join public.class_questions cq on cq.id = a.class_question_id
left join public.fermi_questions fq on fq.id = cq.fermi_question_id
group by s.id, s.class_id, s.username, s.full_name, s.has_completed_exam;

-- =====================================================
-- STEP 10: Helper function to seed class with default questions
-- =====================================================
create or replace function public.seed_class_questions(p_class_id uuid)
returns void language plpgsql as $$
begin
  insert into public.class_questions (class_id, fermi_question_id, "order")
  select p_class_id, fq.id, fq."order"
  from public.fermi_questions fq
  order by fq."order"
  on conflict do nothing;
end$$;

-- =====================================================
-- STEP 11: Enable RLS
-- =====================================================
alter table public.fermi_questions enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.class_questions enable row level security;
alter table public.student_exam_sessions enable row level security;
alter table public.answers enable row level security;

-- =====================================================
-- STEP 12: RLS Policies for fermi_questions (public read)
-- =====================================================
create policy "anyone_can_read_questions" on public.fermi_questions
  for select using (true);

-- =====================================================
-- STEP 13: RLS Policies for classes
-- =====================================================
create policy "teacher_select_own_classes" on public.classes
  for select using (auth.uid() = teacher_id);
create policy "teacher_insert_classes" on public.classes
  for insert with check (auth.uid() = teacher_id);
create policy "teacher_update_own_classes" on public.classes
  for update using (auth.uid() = teacher_id);
create policy "teacher_delete_own_classes" on public.classes
  for delete using (auth.uid() = teacher_id);

-- =====================================================
-- STEP 14: RLS Policies for students
-- =====================================================
create policy "teacher_select_students" on public.students
  for select using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_insert_students" on public.students
  for insert with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_update_students" on public.students
  for update using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_delete_students" on public.students
  for delete using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- =====================================================
-- STEP 15: RLS Policies for class_questions
-- =====================================================
create policy "teacher_manage_class_questions" on public.class_questions
  for all using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "anyone_can_read_class_questions" on public.class_questions
  for select using (true);

-- =====================================================
-- STEP 16: RLS Policies for student_exam_sessions
-- =====================================================
create policy "teacher_manage_sessions" on public.student_exam_sessions
  for all using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- =====================================================
-- STEP 17: RLS Policies for answers
-- =====================================================
create policy "teacher_select_answers" on public.answers
  for select using (exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = student_id and c.teacher_id = auth.uid()
  ));
create policy "teacher_upsert_answers" on public.answers
  for insert with check (exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = student_id and c.teacher_id = auth.uid()
  ));
create policy "teacher_update_answers" on public.answers
  for update using (exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = student_id and c.teacher_id = auth.uid()
  ));

-- =====================================================
-- DONE! Your Fermi Competition database is ready.
-- =====================================================
