import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { TeamManagerLayout } from '../components/TeamManagerLayout'
import FeedbackProvider from '../components/FeedbackProvider'
import usePageClass from '../hooks/usePageClass'

const TeamManagerLayoutWithFeedback = () => {
  usePageClass('private-page')
  const { user } = useAuth()
  const username = user?.email || 'Team Manager User'
  return (
    <FeedbackProvider username={username} userType="team_manager">
      <TeamManagerLayout>
        <Outlet />
      </TeamManagerLayout>
    </FeedbackProvider>
  )
}

export default TeamManagerLayoutWithFeedback 