import React from "react"

interface AuthPageProps {
  // Hero section
  heroTitle?: string
  heroDescription?: string

  // Form content
  children?: React.ReactNode
}

export const AuthView: React.FC<AuthPageProps> = ({
  heroTitle = "",
  heroDescription = "",
  children,
}: AuthPageProps) => {
  const heroLines = heroTitle
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="nmx-auth-view">
      <div className="nmx-split-panel">
        <section className="nmx-split-panel__hero" aria-hidden="true">
          {heroLines.length > 0 && (
            <h1 className="nmx-split-panel__hero-title">
              {heroLines.map((line, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </h1>
          )}
          {heroDescription && (
            <p className="nmx-split-panel__hero-text">{heroDescription}</p>
          )}
        </section>
        <section className="nmx-split-panel__content">{children}</section>
      </div>
    </div>
  )
}
