"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function DatabaseConfigWarning() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white border-3 border-black rounded-[2.5rem] shadow-bold-lg w-full max-w-2xl p-8 md:p-10">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 border-2 border-black rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-2xl font-black text-black">Database Configuration Required</h2>
          <p className="text-gray-600 font-medium mt-2">
            The project management features require a database connection.
          </p>
        </div>
        <div className="space-y-4 mt-6">
          <div className="bg-gray-100 border-2 border-black rounded-xl p-4">
            <h3 className="font-bold mb-2">To enable project features:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm font-medium text-gray-700">
              <li>Create a free PostgreSQL database on <a href="https://neon.tech" target="_blank" rel="noopener" className="text-purple-700 font-bold hover:underline">Neon</a></li>
              <li>Copy your database connection string</li>
              <li>Add it to your <code className="bg-gray-900 text-white px-1 rounded font-mono">.env.local</code> file:</li>
            </ol>
            <div className="mt-3 p-4 bg-gray-900 text-white rounded-xl text-xs font-mono">
              DATABASE_URL=postgresql://username:password@host/database
            </div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Without a database, you can still use the basic task management features with local storage.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = "/"} className="flex-1 bg-white text-black border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow hover:bg-black hover:text-white transition-all">
              Use Local Mode
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1 bg-black text-white border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow transition-all">
              I&apos;ve Added Database URL
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
