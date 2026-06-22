import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Users, Calendar, DollarSign, BookOpen, FileText } from 'lucide-react'
import { api } from '@/api/client'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

interface SearchResult {
  id: string
  type: 'MEMBER' | 'EVENT' | 'COLLECTION' | 'SERMON' | 'COURSE' | string
  title: string
  subtitle?: string
  url?: string
  meta?: string
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

const typeIcon = (type: string) => {
  switch (type) {
    case 'MEMBER': return Users
    case 'EVENT': return Calendar
    case 'COLLECTION': return DollarSign
    case 'SERMON': return BookOpen
    default: return FileText
  }
}

const typeColor = (type: string) => {
  switch (type) {
    case 'MEMBER': return 'bg-blue-100 text-blue-600'
    case 'EVENT': return 'bg-purple-100 text-purple-600'
    case 'COLLECTION': return 'bg-green-100 text-green-600'
    case 'SERMON': return 'bg-indigo-100 text-indigo-600'
    default: return 'bg-white/10 text-slate-300'
  }
}

const typeBadge = (type: string) => {
  switch (type) {
    case 'MEMBER': return 'default'
    case 'EVENT': return 'secondary'
    case 'COLLECTION': return 'success'
    default: return 'outline'
  }
}

const typeRoute = (type: string, id: string) => {
  switch (type) {
    case 'MEMBER': return `/members?highlight=${id}`
    case 'EVENT': return `/events?highlight=${id}`
    case 'COLLECTION': return `/collections`
    case 'SERMON': return `/service`
    case 'COURSE': return `/lms`
    default: return '/'
  }
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const navigate = useNavigate()

  const debounce = useCallback((fn: (v: string) => void, delay: number) => {
    let timeout: ReturnType<typeof setTimeout>
    return (v: string) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => fn(v), delay)
    }
  }, [])

  const debouncedSet = useCallback(debounce(v => setDebouncedQuery(v), 400), [debounce])

  const handleSearch = (v: string) => {
    setQuery(v)
    debouncedSet(v)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`)
      return res.data.data as { results: SearchResult[] }
    },
    enabled: debouncedQuery.length >= 2,
  })

  const results = data?.results ?? []
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Search</h1>
        <p className="text-sm text-slate-400 mt-0.5">Search across members, events, collections and more</p>
      </motion.div>

      <motion.div variants={item} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <Input
          className="pl-12 h-12 text-base"
          placeholder="Search members, events, sermons..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          autoFocus
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </motion.div>

      {query.length > 0 && query.length < 2 && (
        <motion.div variants={item} className="text-center py-8 text-slate-500 text-sm">
          Type at least 2 characters to search
        </motion.div>
      )}

      {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
        <motion.div variants={item} className="text-center py-16">
          <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No results for "{debouncedQuery}"</p>
          <p className="text-sm text-slate-500 mt-1">Try different keywords or check for typos</p>
        </motion.div>
      )}

      {Object.entries(groupedResults).map(([type, items]) => {
        const Icon = typeIcon(type)
        return (
          <motion.div key={type} variants={item}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`p-1.5 rounded-lg ${typeColor(type)}`}>
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                {type.charAt(0) + type.slice(1).toLowerCase()}s ({items.length})
              </h2>
            </div>
            <div className="space-y-2">
              {items.map(r => (
                <Card
                  key={r.id}
                  className="hover:shadow-md transition-all cursor-pointer hover:border-blue-200"
                  onClick={() => navigate(r.url ?? typeRoute(r.type, r.id))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${typeColor(r.type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{r.title}</p>
                        {r.subtitle && <p className="text-sm text-slate-400 truncate">{r.subtitle}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.meta && <span className="text-xs text-slate-500">{r.meta}</span>}
                        <Badge variant={typeBadge(r.type) as any} className="text-xs">{r.type}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )
      })}

      {!query && (
        <motion.div variants={item} className="text-center py-16">
          <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Start typing to search</p>
          <p className="text-sm text-gray-300 mt-1">Search across members, events, finances and more</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Members', 'Events', 'Collections', 'Sermons', 'Courses'].map(t => (
              <button
                key={t}
                onClick={() => handleSearch(t)}
                className="px-3 py-1.5 bg-white/10 text-slate-300 rounded-full text-sm hover:bg-white/10 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
