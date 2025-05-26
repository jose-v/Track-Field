import { useWorkouts } from '../hooks/useWorkouts';
import { useAuth } from '../contexts/AuthContext';
import { useWorkoutStore } from '../lib/workoutStore';
import { useState } from 'react';
import { useDisclosure, Button, Input, Box, IconButton } from '@chakra-ui/react';
import { EditIcon, DeleteIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

export function Workouts() {
  const { workouts = [], createWorkout, deleteWorkout, updateWorkout, refetch } = useWorkouts();
  const { user, signIn } = useAuth();
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  async function handleAddWorkout(e) {
    e.preventDefault();
    setError('');
    if (!newWorkoutName.trim()) return;
    setLoading(true);
    try {
      await createWorkout({ name: newWorkoutName });
      setNewWorkoutName('');
      await refetch();
    } catch (err) {
      setError(err?.message || 'Failed to create workout');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setError('');
    try {
      await deleteWorkout(id);
      await refetch();
    } catch (err) {
      setError(err?.message || 'Failed to delete workout');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditingName(name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await updateWorkout({ id, workout: { name: editingName } });
      setEditingId(null);
      setEditingName('');
      await refetch();
    } catch (err) {
      setError(err?.message || 'Failed to update workout');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setLoginError(err?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  }

  if (!user) {
    return (
      <Box maxW="sm" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md" boxShadow="md">
        <h2>Login</h2>
        <form onSubmit={handleLogin} style={{ marginBottom: 16 }}>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" mb={2} />
          <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" mb={2} />
          <Button type="submit" isLoading={loginLoading} colorScheme="blue" width="100%">Login</Button>
        </form>
        {loginError && <Box color="red.500">{loginError}</Box>}
      </Box>
    );
  }

  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md" boxShadow="md">
      <Button onClick={onOpen} mb={4}>Open Modal</Button>
      <Button onClick={onClose} mb={4} ml={2}>Close Modal</Button>
      <Box mb={4} fontWeight="bold">Workout List:</Box>
      <ul>
        {workouts.map((w) => (
          <li key={w.id} style={{ marginBottom: 8 }}>
            {editingId === w.id ? (
              <>
                <Input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  size="sm"
                  width="auto"
                  display="inline-block"
                  mr={2}
                />
                <IconButton
                  aria-label="Save"
                  icon={<CheckIcon />}
                  size="sm"
                  onClick={() => handleUpdate(w.id)}
                  mr={1}
                  isLoading={loading}
                />
          <IconButton
                  aria-label="Cancel"
                  icon={<CloseIcon />}
                  size="sm"
                  onClick={cancelEdit}
                  mr={1}
                />
              </>
            ) : (
              <>
                {w.name || 'Unnamed workout'}
                    <IconButton
                  aria-label="Edit"
                      icon={<EditIcon />}
                      size="sm"
                  onClick={() => startEdit(w.id, w.name || '')}
                  ml={2}
                  mr={1}
                    />
                    <IconButton
                  aria-label="Delete"
                      icon={<DeleteIcon />}
                      size="sm"
                  onClick={() => handleDelete(w.id)}
                  isLoading={loading}
                />
              </>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddWorkout} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Input value={newWorkoutName} onChange={e => setNewWorkoutName(e.target.value)} placeholder="New workout name" disabled={loading} />
        <Button type="submit" isLoading={loading} colorScheme="green">Add Workout</Button>
              </form>
      {error && <Box color="red.500" mt={2}>{error}</Box>}
          </Box>
  );
} 