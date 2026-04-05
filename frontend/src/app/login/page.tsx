'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Lock, Bot } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate auth API call
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#D4AF37]/10 blur-[120px] pointer-events-none" />

      {/* Auth Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 z-10 relative">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center gap-3 text-white mb-2 jsutify-center">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8963E] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] text-slate-950 mb-4">
               <Bot className="w-7 h-7" />
             </div>
             <span className="text-2xl font-bold tracking-tight">Sales Co-worker</span>
             <p className="text-sm text-slate-400 mt-1 mb-8">Sign in to your intelligent workspace.</p>
          </div>

          <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#B8963E]" />
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input required type="email" placeholder="john@company.com" 
                      value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all placeholder:text-slate-600" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pl-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Password</label>
                    <a href="#" className="text-xs text-[#D4AF37] font-medium hover:underline">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input required type="password" placeholder="••••••••" 
                      value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all placeholder:text-slate-600" />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-[#D4AF37] to-[#B8963E] text-slate-950 hover:opacity-90 font-bold py-6 mt-8 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  {loading ? 'Authenticating...' : <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>}
                </Button>
                
                <div className="pt-6 mt-6 border-t border-slate-800/80">
                  <Button type="button" variant="outline" className="w-full bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white py-5 font-semibold">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Sign in with Google
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-400 mt-8">
            Don't have an account? <a href="/signup" className="text-white hover:text-[#D4AF37] font-semibold transition-colors">Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  )
}
