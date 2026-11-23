import { Link } from 'react-router-dom'
import { GITHUB_PROFILE } from '../lib/site'

export function BrandLockup({ nameTo = '/' }: { nameTo?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <a
        href={GITHUB_PROFILE}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-md"
        aria-label="Devistic on GitHub (opens in a new tab)"
      >
        <img
          src={`${import.meta.env.BASE_URL}devistic-logo.jpg`}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-md object-cover"
        />
      </a>
      <Link to={nameTo} className="text-[1.05rem] font-semibold tracking-tight text-text">
        Devistic CV
      </Link>
    </span>
  )
}
