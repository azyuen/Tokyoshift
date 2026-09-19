export const engines = {
  ts16t: {
    id: 'ts16t',
    name: 'TS-16T 1.8L Turbo I4',
    idleRPM: 900,
    redlineRPM: 8000,
    limiterRPM: 8500,
    inertia: 0.22,
    torqueCurve: [
      [1000, 92],
      [2000, 110],
      [3000, 130],
      [4000, 145],
      [5000, 152],
      [6000, 150],
      [7000, 138],
      [8000, 118],
      [8500, 100],
    ],
  },
};
