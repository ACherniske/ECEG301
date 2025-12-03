import { create } from 'zustand'

export const useRideStore = create((set) => ({
  availableRides: [],
  myRides: [],
  activeRide: null,
  loading: false,
  error: null,

  setAvailableRides: (rides) => set({ availableRides: rides }),
  setMyRides: (rides) => set({ myRides: rides }),
  setActiveRide: (ride) => set({ activeRide: ride }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addToMyRides: (ride) => set((state) => ({
    myRides: [...state.myRides, ride],
    availableRides: state.availableRides.filter(r => r.id !== ride.id),
  })),

  updateRideStatus: (rideId, status) => set((state) => ({
    myRides: state.myRides.map(r => 
      r.id === rideId ? { ...r, status } : r
    ),
  })),

  clearActiveRide: () => set({ activeRide: null }),
}))