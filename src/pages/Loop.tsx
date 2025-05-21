import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  Button,
  useToast,
  Spinner,
  useColorModeValue,
  IconButton,
  Avatar,
  AvatarGroup,
  Text,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import FeedPost from '../components/loop/FeedPost';
import CreatePostModal from '../components/loop/CreatePostModal';
import { FaPlus, FaImage, FaVideo, FaGlobe } from 'react-icons/fa';
import '../styles/Loop.css';

// Global style to hide footer - more aggressive approach
const hideFooter = () => {
  const footerElements = document.querySelectorAll('footer, .footer, .chakra-ui .footer, .chakra-ui footer, [class*="footer"]');
  footerElements.forEach(el => {
    if (el instanceof HTMLElement) {
      el.style.display = 'none';
    }
  });
};

// Try to run this periodically to ensure footer stays hidden
setInterval(hideFooter, 500);

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  created_at: string;
  updated_at: string;
  likes: number;
  comments_count: number;
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  post_type: 'text' | 'image' | 'video';
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

const Loop: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState<any>(null);
  const toast = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Hide footer when component mounts
    hideFooter();
    
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
    };
    
    fetchCurrentUser();
    fetchPosts();
    fetchTeamMembers();
    
    // Cleanup function to run when component unmounts
    return () => {
      // Restore footer visibility logic would go here if needed
      // Currently we're not restoring footer visibility
    };
  }, [navigate]);
  
  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .order('first_name', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };
  
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Step 1: Get posts with filter if needed
      let postsQuery = supabase
        .from('loop_posts')
        .select('id, user_id, content, media_urls, created_at, updated_at, likes, comments_count, post_type')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (activeFilter !== 'all') {
        postsQuery = postsQuery.eq('post_type', activeFilter);
      }
      
      const { data: postsData, error: postsError } = await postsQuery;
      
      if (postsError) throw postsError;
      
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }
      
      // Step 2: Get user details for each post
      const userIds = postsData.map(post => post.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds)
        .limit(50);
      
      if (usersError) throw usersError;
      
      // Step 3: Combine posts with user data
      const postsWithUsers = postsData.map(post => {
        const user = usersData?.find(u => u.id === post.user_id) || {
          first_name: 'Unknown',
          last_name: 'User',
          avatar_url: null
        };
        
        return {
          ...post,
          user: {
            first_name: user.first_name,
            last_name: user.last_name,
            avatar_url: user.avatar_url
          }
        };
      });
      
      setPosts(postsWithUsers);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error fetching posts',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    fetchPosts();
  };
  
  const handleCreatePost = async (newPost: any) => {
    try {
      const { data, error } = await supabase
        .from('loop_posts')
        .insert([newPost])
        .select();
        
      if (error) throw error;
      
      toast({
        title: 'Post created!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error creating post',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <Flex justify="center" align="center" py={10}>
          <Spinner size="xl" color="blue.500" />
        </Flex>
      );
    }

    if (activeTab === 0) { // Team Feed
      if (posts.length === 0) {
        return (
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            py={10}
            textAlign="center"
          >
            <Text fontSize="lg" mb={4}>
              No posts yet. Be the first to share something with your team!
            </Text>
            <Button
              colorScheme="blue"
              onClick={() => setIsCreatePostOpen(true)}
            >
              Create Your First Post
            </Button>
          </Flex>
        );
      }
      
      return (
        <div className="loop-post-list">
          {posts.map((post) => (
            <FeedPost 
              key={post.id} 
              post={post} 
              currentUser={user}
              onCommentAdded={fetchPosts}
            />
          ))}
        </div>
      );
    }
    
    if (activeTab === 1) { // My Posts
      return (
        <div className="loop-post-list">
          {posts
            .filter(post => post.user_id === user?.id)
            .map((post) => (
              <FeedPost 
                key={post.id} 
                post={post} 
                currentUser={user}
                onCommentAdded={fetchPosts}
              />
            ))}
        </div>
      );
    }
    
    // Saved tab
    return (
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        py={10}
        textAlign="center"
      >
        <Text fontSize="lg">
          Saved posts feature coming soon!
        </Text>
      </Flex>
    );
  };
  
  return (
    <div className="loop-page-wrapper">
      <div className="loop-content" style={{position: 'relative'}}>
        {/* Team Members Bar */}
        <div className="team-members-bar">
          {teamMembers.map((member) => (
            <Avatar
              key={member.id}
              src={member.avatar_url}
              name={`${member.first_name} ${member.last_name}`}
              size="md"
              className="team-member-avatar"
              title={`${member.first_name} ${member.last_name}`}
            />
          ))}
        </div>
        {/* Post Input Bar */}
        <div className="post-input-bar">
          <Avatar 
            src={user?.user_metadata?.avatar_url} 
            name={user?.user_metadata?.full_name}
            size="md" 
            mr={4} 
          />
          <div className="post-input-placeholder" onClick={() => setIsCreatePostOpen(true)}>
            {`What's on your mind, ${user?.user_metadata?.first_name || 'there'}?`}
          </div>
        </div>
        {/* Navigation/Filter Bar */}
        <div className="nav-filter-bar">
          <button
            className={`nav-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveFilter('all'); setActiveTab(0); fetchPosts(); }}
          >
            <FaGlobe className="filter-icon" /> All
          </button>
          <button
            className={`nav-pill ${activeFilter === 'image' ? 'active' : ''}`}
            onClick={() => { setActiveFilter('image'); setActiveTab(0); fetchPosts(); }}
          >
            <FaImage className="filter-icon" /> Photos
          </button>
          <button
            className={`nav-pill ${activeFilter === 'video' ? 'active' : ''}`}
            onClick={() => { setActiveFilter('video'); setActiveTab(0); fetchPosts(); }}
          >
            <FaVideo className="filter-icon" /> Videos
          </button>
          <button
            className={`nav-pill ${activeTab === 0 && activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveTab(0); setActiveFilter('all'); fetchPosts(); }}
          >
            Team Feed
          </button>
          <button
            className={`nav-pill ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => { setActiveTab(1); setActiveFilter('all'); fetchPosts(); }}
          >
            My Feed
          </button>
        </div>
        <div className="loop-tab-content">
          {renderTabContent()}
        </div>
      </div>
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onCreatePost={handleCreatePost}
        currentUser={user}
      />
    </div>
  );
};

export default Loop; 