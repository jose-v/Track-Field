    // Status logging for debugging real-time updates
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const isSubscribed = realtimeSubscription?.state === 'joined';
        const lastUpdate = new Date();
      }, 10000); // Every 10 seconds
    }

    // Auto-refresh data every 5 minutes for coaches
    const refreshInterval = setInterval(() => {
      refetchWorkouts();
    }, 300000); // 5 minutes 