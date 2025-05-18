import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CoachLayout } from '../components/CoachLayout'
import FeedbackProvider from '../components/FeedbackProvider'
import usePageClass from '../hooks/usePageClass'

const CoachLayoutWithFeedback = () => {
  usePageClass('private-page')
  const { user } = useAuth()
  const username = user?.email || 'Coach User'
  return (
    <FeedbackProvider username={username} userType="coach">
      <CoachLayout>
        <Outlet />
      </CoachLayout>
    </FeedbackProvider>
  )
}

export default CoachLayoutWithFeedback 