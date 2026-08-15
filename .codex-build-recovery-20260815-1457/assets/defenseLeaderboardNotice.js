/** Bind the Defense leaderboard shortcut to its temporary coming-soon notice. */
export function bindDefenseLeaderboardNotice({
  button = document.getElementById('defense-leaderboard-button'),
  notice = document.getElementById('defense-leaderboard-notice'),
} = {}) {
  if (!button || !notice) return;

  let fadeTimer = null;
  let hideTimer = null;

  button.addEventListener('click', () => {
    window.clearTimeout(fadeTimer);
    window.clearTimeout(hideTimer);

    notice.hidden = false;
    notice.classList.remove('defense-leaderboard-notice--visible');
    // Flush the hidden state so repeat clicks restart the entrance transition reliably.
    void notice.offsetWidth;
    notice.classList.add('defense-leaderboard-notice--visible');

    // Hold the message for two seconds, then let CSS fade it away smoothly.
    fadeTimer = window.setTimeout(() => {
      notice.classList.remove('defense-leaderboard-notice--visible');
      hideTimer = window.setTimeout(() => {
        notice.hidden = true;
      }, 450);
    }, 2000);
  });
}
