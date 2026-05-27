const { TimerManager } = require('../timerManager');

jest.useFakeTimers();

describe('TimerManager', () => {
  test('fires callback after duration', () => {
    const tm = new TimerManager();
    const cb = jest.fn();
    tm.start('r1', 1000, cb);
    jest.advanceTimersByTime(999);
    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('clear prevents callback', () => {
    const tm = new TimerManager();
    const cb = jest.fn();
    tm.start('r1', 1000, cb);
    tm.clear('r1');
    jest.advanceTimersByTime(2000);
    expect(cb).not.toHaveBeenCalled();
  });

  test('start replaces existing timer', () => {
    const tm = new TimerManager();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    tm.start('r1', 1000, cb1);
    tm.start('r1', 1000, cb2);
    jest.advanceTimersByTime(1000);
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
