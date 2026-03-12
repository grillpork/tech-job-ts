
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('Example Test', () => {
    it('renders a heading', () => {
        render(<h1>Hello, Next.js!</h1>)
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toBeInTheDocument()
        expect(heading).toHaveTextContent('Hello, Next.js!')
    })
})
