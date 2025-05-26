import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AthleteLayout } from '../components/AthleteLayout'
import FeedbackProvider from '../components/FeedbackProvider'
import usePageClass from '../hooks/usePageClass'

const AthleteLayoutWithFeedback = () => {
  usePageClass('private-page')
  const { user } = useAuth()
  const username = user?.email || 'Athlete User'
  return (
    <FeedbackProvider username={username} userType="athlete">
      <AthleteLayout>
        <Outlet />
      </AthleteLayout>
    </FeedbackProvider>
  )
}

export default AthleteLayoutWithFeedback 