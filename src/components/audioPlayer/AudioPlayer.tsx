import Player, { type PlayerProps } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function AudioPlayer(props: PlayerProps) {
  return (
    <Player
      {...props}
    />
  )
}
