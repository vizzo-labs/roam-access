import { joinEventAction } from './eventActions';

// Opt-in name for the leaderboard. Anonymous unless ticked; needs never shown.
export function JoinForm({ code, defaultName, showName, joined, back = 'join', submit }: {
  code: string; defaultName: string; showName: boolean; joined: boolean; back?: 'join' | 'board'; submit: string;
}) {
  return (
    <form action={joinEventAction} className="pub-form pub-card" style={{ marginTop: 18 }}>
      <input type="hidden" name="code" value={code}/>
      <input type="hidden" name="back" value={back}/>
      <p style={{ margin: 0 }}>
        The leaderboard is anonymous: you’ll show as “Anonymous mapper” unless you choose to show a name.
        Your access needs are never shown.
      </p>
      <label className="pub-check">
        <input type="checkbox" name="showName" defaultChecked={showName}/>
        <span>Show a name for me on the leaderboard</span>
      </label>
      <label htmlFor="displayName">Name to show <span className="pub-muted" style={{ fontWeight: 500 }}>(only if ticked — a first name or nickname)</span></label>
      <input id="displayName" type="text" name="displayName" defaultValue={defaultName} maxLength={30} autoComplete="nickname"/>
      <div className="pub-actions" style={{ marginTop: 18 }}>
        <button type="submit" className="pub-btn primary">{joined ? 'Save' : submit}</button>
      </div>
    </form>
  );
}
