import Button from './Button'

export default function BackLink({ href, label }) {
  return (
    <div className="mb-4">
      <Button href={href} variant="ghost">
        ← Back to {label}
      </Button>
    </div>
  )
}