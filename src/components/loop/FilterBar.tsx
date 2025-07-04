import React from 'react';
import { Flex, Icon, Box, useColorModeValue } from '@chakra-ui/react';
import { FaGlobe, FaImage, FaVideo, FaBookmark, FaThumbsUp } from 'react-icons/fa';
import '../../styles/Loop.css';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange }) => {
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const filters = [
    { id: 'all', label: 'All Posts', icon: FaGlobe },
    { id: 'image', label: 'Photos', icon: FaImage },
    { id: 'video', label: 'Videos', icon: FaVideo },
    { id: 'popular', label: 'Popular', icon: FaThumbsUp, disabled: true },
    { id: 'saved', label: 'Saved', icon: FaBookmark, disabled: true },
  ];
  
  return (
    <Box 
      className="loop-filter-bar" 
      bg={bgColor} 
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="md" 
      boxShadow="sm"
    >
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`loop-filter-button ${activeFilter === filter.id ? 'active' : ''} ${filter.disabled ? 'disabled' : ''}`}
          disabled={filter.disabled}
          onClick={() => !filter.disabled && onFilterChange(filter.id)}
        >
          <Icon as={filter.icon} mr={2} />
          {filter.label}
        </button>
      ))}
    </Box>
  );
};

export default FilterBar; 