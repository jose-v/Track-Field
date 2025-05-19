import { Outlet, useLocation } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { PageContainer } from '../components/PageContainer'
import FeedbackProvider from '../components/FeedbackProvider'
import usePageClass from '../hooks/usePageClass'

const PublicLayout = () => {
  usePageClass('public-page')
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isPrivate = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/coach') || location.pathname.startsWith('/athlete')
  const fullWidth = !isPrivate
  return (
    <FeedbackProvider>
      <Navigation />
      <PageContainer py={0} fullWidth={fullWidth}>
        <Outlet />
      </PageContainer>
    </FeedbackProvider>
  )
}

export default PublicLayout 