import React, { useEffect, memo, useState } from "react";
import TrackPlayer from "react-native-track-player";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/Feather";
import TextTicker from "react-native-text-ticker";

import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Image
} from "react-native";
import { Text } from "react-native-paper";
import { useStore, useStoreState } from "easy-peasy";
import useMusicPlayer from "../../../misc/hooks/useMusicPlayer";
import {
  useTrackPlayerEvents,
  TrackPlayerEvents
} from "react-native-track-player/index";
import { FALLBACK_MP3, FALLBACK_ALBUM_COVER } from "../../../misc/Utils";
import useApi from "../../../misc/hooks/useApi";
import { useStorage } from "../../../misc/hooks/useStorage";

const events = [
  TrackPlayerEvents.PLAYBACK_TRACK_CHANGED,
  TrackPlayerEvents.PLAYBACK_QUEUE_ENDED
];

const MiniPlayer = memo(({ onPress }) => {
  //const progress = useProgress(1000);
  const [current, setCurrent] = useState({});
  const {
    isPlaying,
    handlePlayPause,
    updateMetadata,
    updateTrackInfo
  } = useMusicPlayer();
  const { getMP3 } = useApi();

  const playerState = useStoreState(state => state.player);

  const store = useStore();

  useEffect(() => {
    setupPlayer();
  }, []);

  useTrackPlayerEvents(events, event => {
    /* we have to do this whole crap since the player doesn't accept updating url of track */
    if (event.type === TrackPlayerEvents.PLAYBACK_TRACK_CHANGED) {
      TrackPlayer.getCurrentTrack().then(currentId => {
        /* if there isn't next track or if track about to play isn't next track (for some reason) */
        if (!event.nextTrack || currentId != event.nextTrack) {
          return;
        }
        /* else we get the full track object */
        TrackPlayer.getTrack(currentId).then(currentTrack => {
          setCurrent(currentTrack);
          if (currentTrack.url !== FALLBACK_MP3) {
            updateTrackInfo(currentTrack);
          }
          /* if next track has fallback url mp3 (which is almost always certain) then stop and bring new url */
          if (currentTrack.url == FALLBACK_MP3) {
            TrackPlayer.stop();
            getMP3(`${currentTrack.artist} ${currentTrack.title}`).then(
              mp3Url => {
                /* we got mp3 url */
                const trackData = {
                  id: currentId,
                  url: mp3Url[0],
                  title: currentTrack.title,
                  artist: currentTrack.artist
                };
                /* we make a copy of the playlist */
                let playerState = store.getState().player;
                let playlist = playerState.queue.slice(0);

                /* find the position of the track */
                let index = playlist.findIndex(track => track.id === currentId);
                /* update the track object */
                playlist.splice(index, 1, trackData);

                /* re-add the playlist */
                TrackPlayer.reset().then(() => {
                  TrackPlayer.add(playlist).then(() => {
                    updateMetadata(trackData);
                    TrackPlayer.skip(currentId).then(() => {
                      TrackPlayer.play();
                    });
                  });
                });
              }
            );
          }
        });
      });
    }
    if (event.type === TrackPlayerEvents.PLAYBACK_QUEUE_ENDED) {
      //console.log('queue ended', event);
    }
  });

  const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();
    TrackPlayer.updateOptions({
      stopWithApp: false,
      capabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
        TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
        TrackPlayer.CAPABILITY_STOP
      ],
      compactCapabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_SKIP_TO_NEXT
      ]
    });
  };

  let coverImage = FALLBACK_ALBUM_COVER;
  if (current.artwork && current.artwork !== FALLBACK_ALBUM_COVER) {
    coverImage = current.artwork;
  }
  if (
    playerState.current.artwork &&
    playerState.current.artwork !== FALLBACK_ALBUM_COVER
  ) {
    coverImage = playerState.current.artwork;
  }
  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>
        <Image
          style={{ width: 48, height: 48, marginRight: 10 }}
          source={{
            uri: coverImage
          }}></Image>
        <View
          style={{
            flexDirection: "column",
            flex: 1,
            height: "100%",
            justifyContent: "center"
          }}>
          <TextTicker
            style={styles.trackTitle}
            scrollSpeed={250}
            loop
            bounce={false}
            repeatSpacer={50}
            marqueeDelay={0}
            numberOfLines={1}>
            {current.title || ""}
          </TextTicker>

          <Text numberOfLines={1} style={styles.artistName}>
            {current.artist || ""}
          </Text>
        </View>
        <MaterialIcon
          style={{ marginRight: "5%" }}
          name={isPlaying ? "pause" : "play"}
          size={32}
          color={"#fff"}
          onPress={handlePlayPause}
        />

        <Icon name='chevron-up' color='white' size={24} onPress={onPress} />
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 68,
    backgroundColor: "#1a1a1b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16
  },
  trackTitle: { color: "white", fontFamily: "CircularStd-Bold" },
  artistName: { fontSize: 12, marginTop: 1 }
});

export default MiniPlayer;
