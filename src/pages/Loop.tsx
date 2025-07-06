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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import FeedPost from '../components/loop/FeedPost';
import CreatePostModal from '../components/loop/CreatePostModal';
import PostModal from '../components/loop/PostModal';
import { FaPlus, FaImage, FaVideo, FaGlobe, FaUsers } from 'react-icons/fa';
import '../styles/Loop.css';
import PageHeader from '../components/PageHeader';
import { usePageHeader } from '../hooks/usePageHeader';

// Global style to hide footer - more specific approach to avoid modal footers
const hideFooter = () => {
  // Only target page footers, not modal footers
  const footerElements = document.querySelectorAll('footer:not(.chakra-modal *), .footer:not(.chakra-modal *), .page-footer, [data-testid="page-footer"]');
  footerElements.forEach(el => {
    if (el instanceof HTMLElement) {
      // Additional check to make sure we're not hiding modal footers
      const isInsideModal = el.closest('.chakra-modal, [role="dialog"], .modal');
      if (!isInsideModal) {
        el.style.display = 'none';
      }
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
  previewComments?: any[];
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
  
  // Use page header hook
  usePageHeader({
    title: 'Loop',
    subtitle: 'Connect with your team and share updates',
    icon: FaUsers
  });
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  
  // Add state for pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  
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
    // Cleanup function to run when component unmounts
    return () => {
      // Restore footer visibility logic would go here if needed
      // Currently we're not restoring footer visibility
    };
  }, [navigate]);

  // Separate useEffect to fetch team members when user is set
  useEffect(() => {
    if (user?.id) {
      fetchTeamMembers();
    }
  }, [user]);
  
  const fetchTeamMembers = async () => {
    console.log('fetchTeamMembers called with user:', user?.id);
    
    try {
      // First try to get team members from teams user belongs to
      const { data: userTeams, error: userTeamsError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (userTeamsError) throw userTeamsError;
      
      console.log('User teams found:', userTeams?.length || 0);
      let profiles = [];
      
      if (userTeams && userTeams.length > 0) {
        const teamIds = userTeams.map(team => team.team_id);
        
        // Get all active team members from these teams
        const { data: teamMembers, error: teamMembersError } = await supabase
          .from('team_members')
          .select('user_id')
          .in('team_id', teamIds)
          .eq('status', 'active');
        
        if (teamMembersError) throw teamMembersError;
        
        console.log('Team members found in teams:', teamMembers?.length || 0);
        if (teamMembers && teamMembers.length > 0) {
          // Get unique user IDs
          const uniqueUserIds = [...new Set(teamMembers.map(member => member.user_id))];
          
          // Get profiles for these users
          const { data: teamProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', uniqueUserIds);
          
          if (!profilesError && teamProfiles) {
            console.log('Team profiles found:', teamProfiles.length);
            profiles = teamProfiles;
          }
        }
      }
      
      // If no team members found, fallback to show coaches/active users with proper profiles
      if (profiles.length === 0) {
        console.log('No team members found, falling back to active profiles');
        const { data: fallbackProfiles, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .not('first_name', 'is', null)
          .not('last_name', 'is', null)
          .limit(10);
        
        if (!fallbackError && fallbackProfiles) {
          console.log('Fallback profiles found:', fallbackProfiles.length);
          profiles = fallbackProfiles;
        }
      }
      
      // Process and filter profiles
      const uniqueMembers = new Map();
      profiles?.forEach(profile => {
        if (profile && profile.id && profile.first_name && profile.last_name) {
          // Less aggressive filtering - only remove obvious test accounts
          const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
          const isTestAccount = fullName.includes('test account') || 
                               fullName.includes('dummy user') || 
                               fullName.includes('sample data') ||
                               (profile.first_name.toLowerCase() === 'test' && profile.last_name.toLowerCase() === 'user');
          
          if (!isTestAccount && !uniqueMembers.has(profile.id)) {
            uniqueMembers.set(profile.id, {
              id: profile.id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url
            });
          }
        }
      });
      
      // Sort by first name and limit to reasonable number
      const sortedMembers = Array.from(uniqueMembers.values())
        .sort((a, b) => a.first_name.localeCompare(b.first_name))
        .slice(0, 15);
      
      console.log('Team members found:', sortedMembers.length);
      setTeamMembers(sortedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };
  
  const fetchPosts = async (pageToFetch = 0, append = false) => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    if (!append) setIsLoading(true);
    try {
      let from = pageToFetch * PAGE_SIZE;
      let to = from + PAGE_SIZE - 1;
      // 1. Fetch posts with author profile in a single query
      let postsQuery = supabase
        .from('loop_posts')
        .select(`
          *,
          user:profiles!loop_posts_user_id_fkey (id, first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (activeFilter !== 'all') {
        postsQuery = postsQuery.eq('post_type', activeFilter);
      }
      const { data: postsData, error: postsError } = await postsQuery;
      if (postsError) throw postsError;
      if (!postsData || postsData.length === 0) {
        if (append) setHasMore(false);
        if (!append) setPosts([]);
        setIsLoading(false);
        setIsFetchingMore(false);
        return;
      }
      // 2. Fetch latest 2 comments for all post IDs in one query (with commenter profile)
      const postIds = postsData.map(post => post.id);
      const { data: commentsData, error: commentsError } = await supabase
        .from('loop_comments')
        .select(`
          *,
          user:profiles!loop_comments_user_id_fkey (id, first_name, last_name, avatar_url)
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: false });
      if (commentsError) throw commentsError;
      // Group and limit comments per post
      const commentsByPost = {};
      if (commentsData) {
        for (const comment of commentsData) {
          if (!commentsByPost[comment.post_id]) commentsByPost[comment.post_id] = [];
          if (commentsByPost[comment.post_id].length < 2) {
            commentsByPost[comment.post_id].push(comment);
          }
        }
      }
      // Merge comments into posts
      const postsWithUsersAndComments = postsData.map(post => {
        return {
          ...post,
          user: post.user || { first_name: 'Unknown', last_name: 'User', avatar_url: null },
          previewComments: (commentsByPost[post.id] || []).reverse() // show oldest first
        };
      });
      if (append) {
        setPosts(prev => [...prev, ...postsWithUsersAndComments]);
      } else {
        setPosts(postsWithUsersAndComments);
      }
      setHasMore(postsData.length === PAGE_SIZE);
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
      setIsFetchingMore(false);
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

  // Add this function to update comments_count in local state
  const handleCommentAdded = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      )
    );
  };

  // Add scroll event listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoading || isFetchingMore) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      // If user is within 200px of the bottom, load more
      if (scrollY + viewportHeight >= fullHeight - 200) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchPosts(nextPage, true);
          return nextPage;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, isFetchingMore, activeFilter]);

  // Reset posts and pagination when filter changes
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPosts(0, false);
    // eslint-disable-next-line
  }, [activeFilter]);

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
            <Text fontSize="lg" mb={4} color={textColor}>
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
              onCommentAdded={() => handleCommentAdded(post.id)}
              previewComments={post.previewComments}
              onOpenModal={() => {
                setSelectedPost(post);
                setIsPostModalOpen(true);
              }}
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
                onCommentAdded={() => handleCommentAdded(post.id)}
                previewComments={post.previewComments}
                onOpenModal={() => {
                  setSelectedPost(post);
                  setIsPostModalOpen(true);
                }}
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
        <Text fontSize="lg" color={textColor}>
          Saved posts feature coming soon!
        </Text>
      </Flex>
    );
  };
  
  return (
    <div className="loop-page-wrapper">
      {/* Desktop Header */}
      <PageHeader
        title="Loop"
        subtitle="Connect with your team and share updates"
        icon={FaUsers}
      />
      
      <div className="loop-content" style={{position: 'relative'}}>
        {/* Team Members Bar */}
        <Box
          display="flex"
          alignItems="center"
          p={3}
          mb={4}
          overflowX="auto"
          bg={bgColor}
          borderRadius="md"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
          maxW="600px"
          w="100%"
          mx="auto"
          gap={2}
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          {teamMembers.map((member) => (
            <Avatar
              key={member.id}
              src={member.avatar_url}
              name={`${member.first_name} ${member.last_name}`}
              size="md"
              cursor="pointer"
              transition="transform 0.2s"
              border="2px solid"
              borderColor={borderColor}
              boxShadow="sm"
              _hover={{ transform: 'scale(1.05)' }}
              title={`${member.first_name} ${member.last_name}`}
              flexShrink={0}
            />
          ))}
        </Box>
        {/* Post Input Bar */}
        <Box
          display="flex"
          alignItems="center"
          bg={bgColor}
          borderRadius="16px"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
          p={4}
          mb={4}
          maxW="600px"
          w="100%"
          mx="auto"
        >
          <Avatar 
            src={user?.user_metadata?.avatar_url} 
            name={user?.user_metadata?.full_name}
            size="md" 
            mr={4} 
          />
          <Box
            flex={1}
            bg={inputBg}
            borderRadius="md"
            p={3}
            color={placeholderColor}
            cursor="pointer"
            onClick={() => setIsCreatePostOpen(true)}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
            transition="background-color 0.2s"
          >
            {`What's on your mind, ${user?.user_metadata?.first_name || 'there'}?`}
          </Box>
        </Box>
        {/* Navigation/Filter Bar */}
        <Box
          display="flex"
          gap={2}
          p={3}
          bg={bgColor}
          borderRadius="md"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
          mb={4}
          maxW="600px"
          w="100%"
          mx="auto"
          overflowX="auto"
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
        >
          <Button
            leftIcon={<FaGlobe />}
            size="sm"
            variant={activeFilter === 'all' ? 'solid' : 'ghost'}
            colorScheme={activeFilter === 'all' ? 'blue' : 'gray'}
            onClick={() => { setActiveFilter('all'); setActiveTab(0); fetchPosts(); }}
            flexShrink={0}
          >
            All
          </Button>
          <Button
            leftIcon={<FaImage />}
            size="sm"
            variant={activeFilter === 'image' ? 'solid' : 'ghost'}
            colorScheme={activeFilter === 'image' ? 'blue' : 'gray'}
            onClick={() => { setActiveFilter('image'); setActiveTab(0); fetchPosts(); }}
            flexShrink={0}
          >
            Photos
          </Button>
          <Button
            leftIcon={<FaVideo />}
            size="sm"
            variant={activeFilter === 'video' ? 'solid' : 'ghost'}
            colorScheme={activeFilter === 'video' ? 'blue' : 'gray'}
            onClick={() => { setActiveFilter('video'); setActiveTab(0); fetchPosts(); }}
            flexShrink={0}
          >
            Videos
          </Button>
          <Button
            size="sm"
            variant={activeTab === 0 && activeFilter === 'all' ? 'solid' : 'ghost'}
            colorScheme={activeTab === 0 && activeFilter === 'all' ? 'blue' : 'gray'}
            onClick={() => { setActiveTab(0); setActiveFilter('all'); fetchPosts(); }}
            flexShrink={0}
          >
            Team Feed
          </Button>
          <Button
            size="sm"
            variant={activeTab === 1 ? 'solid' : 'ghost'}
            colorScheme={activeTab === 1 ? 'blue' : 'gray'}
            onClick={() => { setActiveTab(1); setActiveFilter('all'); fetchPosts(); }}
            flexShrink={0}
          >
            My Feed
          </Button>
        </Box>
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
      {/* Only render PostModal when open and a post is selected */}
      {isPostModalOpen && selectedPost && (
        <PostModal
          isOpen={true}
          onClose={() => setIsPostModalOpen(false)}
          post={selectedPost}
          currentUser={user}
        />
      )}

    </div>
  );
};

export default Loop; 