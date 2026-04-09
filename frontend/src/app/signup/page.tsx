'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Lock, User, Briefcase, Layers } from 'lucide-react'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' })

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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Left Branding Panel */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10">
         <div>
            <div className="flex items-center gap-3 text-white mb-16">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl text-white">
                <Layers className="w-6 h-6" fill="currentColor" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">SalesHub</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 mt-16">
              Scale your pipeline with <span className="text-blue-500">Intelligent Automation</span>.
            </h1>
           <p className="text-lg text-slate-400 max-w-md leading-relaxed">
             Join leading sales teams using AI-driven insights to automate PBX call logging, extract leads, and negotiate at scale.
           </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-lg">
          {[
            { title: 'Smart Call Routing', desc: 'Yeastar PBX natively integrated.' },
            { title: 'AI Tear Sheets', desc: 'Pre-meeting insights directly via Outlook.' },
            { title: 'Zero Data Entry', desc: 'CRM synced automatically in real-time.' },
            { title: 'Intelligent Inbox', desc: 'Gemini drafts replies instantly.' }
          ].map((feat, i) => (
              <div key={i} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center mb-3 border border-blue-500/20">
                  <CheckIcon className="w-4 h-4 text-blue-500" />
                </div>
               <h3 className="text-sm font-bold text-white mb-1">{feat.title}</h3>
               <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
             </div>
          ))}
        </div>

         <div className="text-sm text-slate-500 mt-20">
            © 2026 SalesHub AI. Professional Suite.
         </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 z-10 relative">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-3 text-white mb-10 justify-center">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
               <Layers className="w-6 h-6" fill="currentColor" />
             </div>
             <span className="text-xl font-bold tracking-tight">SalesHub</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Create an account</h2>
            <p className="text-sm text-slate-400">Start closing deals faster today.</p>
          </div>

          <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-700" />
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input required type="text" placeholder="John Doe" 
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">Company</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input required type="text" placeholder="Tech Inc" 
                        value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input required type="email" placeholder="john@company.com" 
                      value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input required type="password" placeholder="••••••••" 
                      value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-500 font-bold py-5 mt-6 shadow-xl transition-colors">
                  {loading ? 'Creating Account...' : <span className="flex items-center gap-2">Sign up for Workspace <ArrowRight className="w-4 h-4" /></span>}
                </Button>

                <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
                  By clicking sign up, you agree to our <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>.
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-400 mt-8">
            Already have an account? <a href="/login" className="text-white hover:text-blue-500 font-semibold transition-colors">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  )
}

function CheckIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
