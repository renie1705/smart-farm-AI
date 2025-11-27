
// Mock data for groundwater levels
const mockData = [
  { id: 1, location: 'Well A', level: 10.5, timestamp: '2024-05-24T10:00:00Z' },
  { id: 2, location: 'Well B', level: 12.3, timestamp: '2024-05-24T10:05:00Z' },
  { id: 3, location: 'Well C', level: 9.8, timestamp: '2024-05-24T10:10:00Z' },
];

export const fetchGroundwaterData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockData);
    }, 1000);
  });
};
