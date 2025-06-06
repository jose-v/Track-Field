import { useToast, useDisclosure } from '@chakra-ui/react';
import { useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { TrackMeet } from '../../types/trackMeets';
import { EmailShareModal } from './EmailShareModal';

interface MeetPDFGeneratorProps {
  meet: TrackMeet;
  athleteNames?: string[];
  eventCount?: number;
  assistantCoaches?: Array<{
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  }>;
}

export const useMeetPDFGenerator = ({
  meet,
  athleteNames = [],
  eventCount = 0,
  assistantCoaches = []
}: MeetPDFGeneratorProps) => {
  const toast = useToast();
  const { isOpen: isEmailModalOpen, onOpen: onEmailModalOpen, onClose: onEmailModalClose } = useDisclosure();

  const generatePDF = useCallback(async () => {
    try {
      // Create PDF content
      const pdfContent = `
        TRACK MEET INFORMATION
        
        Meet: ${meet.name}
        Date: ${meet.meet_date}${meet.end_date ? ` - ${meet.end_date}` : ''}
        Venue: ${meet.venue_name || 'TBD'}
        Location: ${[meet.city, meet.state].filter(Boolean).join(', ') || 'TBD'}
        Status: ${meet.status}
        
        ${meet.description ? `Description: ${meet.description}\n` : ''}
        
        LOGISTICS
        Events: ${eventCount}
        Athletes: ${athleteNames.length}
        ${athleteNames.length > 0 ? `\nAthlete List:\n${athleteNames.map(name => `• ${name}`).join('\n')}` : ''}
        
        ${assistantCoaches.filter(coach => coach.name).length > 0 ? `
        ASSISTANT COACHES
        ${assistantCoaches.filter(coach => coach.name).map((coach, index) => `
        ${index + 1}. ${coach.name}
        ${coach.phone ? `   Phone: ${coach.phone}` : ''}
        ${coach.email ? `   Email: ${coach.email}` : ''}
        `).join('\n')}` : ''}
        
        ${meet.join_link ? `\nRegistration Link: ${meet.join_link}` : ''}
        
        Generated on: ${new Date().toLocaleDateString()}
      `;

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${meet.name.replace(/[^a-zA-Z0-9]/g, '_')}_meet_info.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: 'Meet information has been downloaded successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to generate meet information file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [meet, athleteNames, eventCount, assistantCoaches, toast]);

  // Memoize email content to prevent unnecessary re-computation
  const emailContent = useMemo(() => {
    const emailSubject = `Track Meet: ${meet.name}`;
    const emailBody = `Hello,

I wanted to share the details for the upcoming track meet:

Meet: ${meet.name}
Date: ${meet.meet_date}${meet.end_date ? ` - ${meet.end_date}` : ''}
Venue: ${meet.venue_name || 'TBD'}
Location: ${[meet.city, meet.state].filter(Boolean).join(', ') || 'TBD'}

${meet.description ? `Description: ${meet.description}\n` : ''}

Events: ${eventCount}
Athletes Participating: ${athleteNames.length}

${athleteNames.length > 0 ? `\nAthlete List:\n${athleteNames.map(name => `• ${name}`).join('\n')}\n` : ''}

${assistantCoaches.filter(coach => coach.name).length > 0 ? `
Assistant Coaches:
${assistantCoaches.filter(coach => coach.name).map((coach, index) => `
${index + 1}. ${coach.name}
${coach.phone ? `   Phone: ${coach.phone}` : ''}
${coach.email ? `   Email: ${coach.email}` : ''}
`).join('\n')}` : ''}

${meet.join_link ? `Registration Link: ${meet.join_link}\n` : ''}

Best regards`;

    return { subject: emailSubject, body: emailBody };
  }, [meet, athleteNames, eventCount, assistantCoaches]);

  const shareViaMail = useCallback(() => {
    // Open the email modal
    onEmailModalOpen();
  }, [onEmailModalOpen]);

  // Create a stable EmailModal component to prevent flickering
  const EmailModal = useCallback(() => (
    <EmailShareModal
      isOpen={isEmailModalOpen}
      onClose={onEmailModalClose}
      defaultSubject={emailContent.subject}
      defaultBody={emailContent.body}
    />
  ), [isEmailModalOpen, onEmailModalClose, emailContent.subject, emailContent.body]);

  return { 
    generatePDF, 
    shareViaMail,
    EmailModal
  };
};

export default useMeetPDFGenerator; 