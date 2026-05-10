import React from "react"
import "./AuthPage.scss"

interface AuthPageProps {
  // Hero section
  heroTitle?: string
  heroDescription?: string

  // Form content
  children?: React.ReactNode
}

export const AuthPage: React.FC<AuthPageProps> = ({
  heroTitle = "",
  heroDescription = "",
  children,
}: AuthPageProps) => {
  const heroLines = heroTitle
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="nmx-auth-page">
      <div className="nmx-auth-page__layout">
        <section className="nmx-auth-page__hero" aria-hidden="true">
          {heroLines.length > 0 && (
            <h1 className="nmx-auth-page__hero-title">
              {heroLines.map((line, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </h1>
          )}
          {heroDescription && (
            <p className="nmx-auth-page__hero-text">{heroDescription}</p>
          )}
        </section>
        <section className="nmx-auth-page__panel">{children}</section>
      </div>
    </div>
  )
}
