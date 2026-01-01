type Props = {
  generated: number
  completed: number
  totalQuestions?: number
}

export default function ClassStats({ generated, completed, totalQuestions = 25 }: Props) {
  const pending = generated - completed

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="stat-card">
        <div className="stat-value text-duo-blue">{generated}</div>
        <div className="stat-label">Generated</div>
      </div>
      <div className="stat-card">
        <div className="stat-value text-duo-green">{completed}</div>
        <div className="stat-label">Completed</div>
      </div>
      <div className="stat-card">
        <div className="stat-value text-duo-yellow-dark">{pending}</div>
        <div className="stat-label">Pending</div>
      </div>
      <div className="stat-card">
        <div className="stat-value text-duo-purple">{totalQuestions}</div>
        <div className="stat-label">Questions</div>
      </div>
    </div>
  )
}
