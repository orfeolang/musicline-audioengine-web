/*********************************************************************
* AudioScheduler
*
* Sends timed events to a callback using precise timing.
* @inspired by https://www.html5rocks.com/en/tutorials/audio/scheduling
*
* Javascript's setTimeout is used to create a recursive loop in which
* events are scheduled for the web audio clock. As often as indicated by
* the scheduleInterval variable, events are scheduled as far into the
* future as indicated by the scheduleLookahead variable.
*
* This dual clock system (Javascript's setTimeout clock + web audio clock),
* permits us to change the tempo and add events anytime during playback.
*********************************************************************/
const AudioScheduler = function (audioContext, audioNodes, {
  scheduleInterval =  50,  // in milliseconds
  scheduleLookahead = 100, // in milliseconds
  events = [],
  callback = function(){},
  } = {}
) {
    // Keep track of all created audio nodes so they can be stopped.
  this.audioContext = audioContext
    // Keep track of all created audio nodes so they can be stopped.
  this.audioNodes = audioNodes
    // Schedule new events at this interval.
  this.scheduleInterval = scheduleInterval
    // Schedule new events this far into the future.
  this.scheduleLookahead = scheduleLookahead
    // An events object that must at least contain the time property for each event.
  this.events = events
    // A function used to play the events.
  this.callback = callback
    // A needle used to go through the events index by index.
  this.eventsIndexNeedle
    // Used by clearTimeout() to identify the setTimeout timer.
  this.timerID
    // The offset between the time at audioContext creation and audioContext.currentTime.
  this.startTimeOffset
}

AudioScheduler.prototype._stopAllAudioNodes = function() {
  for (let i = 0, len = this.audioNodes.length; i < len; i++) {
    this.audioNodes[i].stop(0)
  }
}

AudioScheduler.prototype.stop = function() {
  if (this.audioContext.state === 'running') {
    this.audioContext.suspend()
  }
  this._stopAllAudioNodes()
  clearTimeout(this.timerID)
}

AudioScheduler.prototype.reset = function() {
  if (this.audioContext.state === 'suspended') {
    this.audioContext.resume()
  }
  this.eventsIndexNeedle = 0
  this.timerID = null
  this.startTimeOffset = this.audioContext.currentTime
}

AudioScheduler.prototype.start = function() {
  this.stop()
  this.reset()
  this.play()
}

AudioScheduler.prototype.play = function() {
  while(
    this.eventsIndexNeedle < this.events.length &&
    typeof this.events[this.eventsIndexNeedle].time === "number" &&
    (
      this.events[this.eventsIndexNeedle].time + this.startTimeOffset <
      this.audioContext.currentTime + (this.scheduleLookahead / 1000)
    )
  ) {
      this.callback(this.events[this.eventsIndexNeedle], this.startTimeOffset)
      this.eventsIndexNeedle++
  }
  this.timerID = setTimeout(() => { this.play() }, this.scheduleInterval)
}

AudioScheduler.prototype.pause = function() {
  if (this.audioContext.state === 'running') {
    this.audioContext.suspend()
  }
  else if (this.audioContext.state === 'suspended') {
    this.audioContext.resume()
  }
}
