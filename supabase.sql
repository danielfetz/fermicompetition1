-- Fermi Competition schema and RLS
-- Run in Supabase SQL editor

-- Auth: Teachers use Supabase auth (email/password) via dashboard.
-- Students are app-level users, stored in public schema.

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  num_students int not null check (num_students > 0 and num_students <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  username text not null,
  password_hash text not null,
  full_name text,
  created_at timestamptz not null default now(),
  unique(class_id, username)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  prompt text not null,
  correct_value double precision,
  "order" int not null,
  created_at timestamptz not null default now(),
  unique(class_id, "order")
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  value double precision not null,
  confidence_pct int not null check (confidence_pct in (10,30,50,70,90)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, question_id)
);

-- trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;
drop trigger if exists trg_answers_updated on public.answers;
create trigger trg_answers_updated before update on public.answers
for each row execute function public.set_updated_at();

-- Views for scoring (±50% tolerance)
create or replace view public.student_scores as
select a.student_id,
       a.class_id,
       count(*) filter (
         where q.correct_value is not null
           and a.value between (q.correct_value*0.5) and (q.correct_value*1.5)
       ) as correct_count
from public.answers a
join public.questions q on q.id = a.question_id
group by a.student_id, a.class_id;

-- Enable RLS
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;

-- Policies: teachers can access only their data (by auth.uid())
create policy "teacher_select_own_classes" on public.classes
  for select using (auth.uid() = teacher_id);
create policy "teacher_insert_classes" on public.classes
  for insert with check (auth.uid() = teacher_id);
create policy "teacher_update_own_classes" on public.classes
  for update using (auth.uid() = teacher_id);
create policy "teacher_delete_own_classes" on public.classes
  for delete using (auth.uid() = teacher_id);

create policy "teacher_select_students" on public.students
  for select using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_insert_students" on public.students
  for insert with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_update_students" on public.students
  for update using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_delete_students" on public.students
  for delete using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

create policy "teacher_select_questions" on public.questions
  for select using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_crud_questions" on public.questions
  for all using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())) with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

create policy "teacher_select_answers" on public.answers
  for select using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_upsert_answers" on public.answers
  for insert with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher_update_answers" on public.answers
  for update using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- Helpers: seed 10 questions per class quickly
create or replace function public.seed_default_questions(p_class uuid)
returns void language plpgsql as $$
begin
  for i in 1..10 loop
    insert into public.questions (class_id, prompt, correct_value, "order")
    values (p_class, 'Question '||i, null, i)
    on conflict do nothing;
  end loop;
end$$;

