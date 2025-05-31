import React from 'react';
import { Icon, IconProps } from '@chakra-ui/react';

export const SparkleIcon: React.FC<IconProps> = (props) => {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12 0L14.8 8.8L24 12L14.8 15.2L12 24L9.2 15.2L0 12L9.2 8.8L12 0Z"
        fillRule="evenodd"
      />
    </Icon>
  );
};

export default SparkleIcon; 