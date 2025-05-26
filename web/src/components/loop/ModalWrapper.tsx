import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Divider,
} from '@chakra-ui/react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: string;
  bgColor?: string;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'lg',
  bgColor,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size={size} isCentered>
    <ModalOverlay />
    <ModalContent bg={bgColor}>
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton />
      <Divider />
      <ModalBody>{children}</ModalBody>
      {footer && (
        <>
          <Divider />
          <ModalFooter>{footer}</ModalFooter>
        </>
      )}
    </ModalContent>
  </Modal>
);

export default ModalWrapper; 