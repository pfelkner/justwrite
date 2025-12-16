import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'

type AuthMode = 'signIn' | 'signUp'

export function AuthPage() {
    const { signIn } = useAuthActions()
    const [mode, setMode] = useState<AuthMode>('signIn')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.set('email', email)
            formData.set('password', password)
            formData.set('flow', mode)
            if (mode === 'signUp' && name) {
                formData.set('name', name)
            }

            await signIn('password', formData)
        } catch (err) {
            setError(mode === 'signIn'
                ? 'Ungültige E-Mail oder Passwort'
                : 'Registrierung fehlgeschlagen. Versuche es erneut.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-border/50">
                <CardHeader className="text-center">
                    <div className="text-4xl mb-2">✍️</div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        JustWrite
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        {mode === 'signIn'
                            ? 'Melde dich an, um weiterzuschreiben'
                            : 'Erstelle einen Account und starte deine Schreibreise'}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signUp' && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Name</label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Dein Name"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1.5">E-Mail</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="deine@email.de"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Passwort</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={8}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? 'Bitte warten...'
                                : mode === 'signIn'
                                    ? 'Anmelden'
                                    : 'Registrieren'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        {mode === 'signIn' ? (
                            <p className="text-muted-foreground">
                                Noch kein Account?{' '}
                                <button
                                    onClick={() => setMode('signUp')}
                                    className="text-primary hover:underline"
                                >
                                    Jetzt registrieren
                                </button>
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                Bereits registriert?{' '}
                                <button
                                    onClick={() => setMode('signIn')}
                                    className="text-primary hover:underline"
                                >
                                    Anmelden
                                </button>
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
