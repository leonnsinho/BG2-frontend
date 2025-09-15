import { Layout } from '../components/layout/Layout'
import MatrizBossaNavigation from '../components/MatrizBossaNavigation'

export default function MatrizBossaPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="py-12">
          <MatrizBossaNavigation />
        </div>
      </div>
    </Layout>
  )
}