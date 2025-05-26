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
  useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import FeedPost from '../components/loop/FeedPost';
import CreatePostModal from '../components/loop/CreatePostModal';
import PostModal from '../components/loop/PostModal';
import { FaPlus, FaImage, FaVideo, FaGlobe } from 'react-icons/fa';
import '../styles/Loop.css';

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
  
  // Add state for pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { isOpen: isTestOpen, onOpen: onTestOpen, onClose: onTestClose } = useDisclosure();
  
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
        {/* Add a button to open the test modal for debugging */}
        <Button colorScheme="pink" onClick={onTestOpen} mb={4}>Open Test Modal</Button>
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
      {/* Minimal test modal for debugging flicker */}
      {isTestOpen && (
        <Modal isOpen={isTestOpen} onClose={onTestClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Test Modal</ModalHeader>
            <ModalBody>Test content</ModalBody>
            <Box p={4}><Button onClick={onTestClose}>Close</Button></Box>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default Loop; 