import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  Portal,
  Dialog,
  Button,
  TextInput,
  withTheme
} from "react-native-paper";
import { ScrollView } from "react-native";
import { StyleSheet, Dimensions } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import AntDesign from "react-native-vector-icons/AntDesign";
import { PlaylistsList } from "./components/PlaylistsList";
import { useStorage } from "../misc/hooks/useStorage";
import { getRandomInt } from "../misc/Utils";
import NavigationService from "../misc/NavigationService";
import { usePlaylist } from "../misc/hooks/usePlaylist";
import { withNavigationFocus } from "react-navigation";

const PlaylistScreen = ({ navigation = null, isFocused }) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [reloadPlaylist, setReloadPlaylist] = useState(false);
  const { addToPlaylist } = usePlaylist();

  const { storage } = useStorage();

  /* mode of playlist, ADD = will add a song */
  const mode = navigation && navigation.getParam("mode", "");
  const trackItem = navigation && navigation.getParam("track", "");

  const showDialog = () => setDialogVisible(true);

  const hideDialog = () => {
    setDialogVisible(false);
    setInputValue("");
  };

  const createPlaylist = async () => {
    let playlists = await storage.get("playlists");
    playlists = JSON.parse(playlists);
    let maxId = Math.max(...playlists.map(o => o.id), 1);
    const newPlaylist = {
      id: maxId + 1,
      name: inputValue,
      tracks: [],
      trackCount: 0
    };
    playlists.push(newPlaylist);
    await storage.set("playlists", JSON.stringify(playlists));
    setReloadPlaylist(!reloadPlaylist);
    hideDialog();
  };
  const handleChange = text => {
    setInputValue(text);
  };

  const handlePress = async playlistItem => {
    if (mode === "ADD") {
      let result = await addToPlaylist(playlistItem.id, trackItem);
      NavigationService.goBack();
    } else {
      NavigationService.navigate("PlaylistTracks", {
        playlist: playlistItem
      });
    }
  };
  useEffect(() => {
    if (isFocused) {
      setReloadPlaylist(!reloadPlaylist);
    }
  }, [isFocused]);

  return (
    <ScrollView
      contentContainerStyle={{
        backgroundColor: "#1a1a1b",
        ...styles.container
      }}>
      <TouchableOpacity style={styles.playlistButton} onPress={showDialog}>
        <AntDesign name={"plus"} style={styles.plusIcon} size={18}></AntDesign>
        <Text style={styles.playlistButtonText}>Create playlist</Text>
      </TouchableOpacity>
      <PlaylistsList
        reload={reloadPlaylist}
        onPress={handlePress}></PlaylistsList>
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Create playlist</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label='Name'
              value={inputValue}
              onChangeText={handleChange}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog} mode={"contained"}>
              Cancel
            </Button>
            <Button onPress={createPlaylist} mode={"contained"}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  plusIcon: {
    color: "white",
    marginRight: 6
  },
  playlistButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginVertical: 24,
    marginHorizontal: 12,
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 4
  },
  playlistButtonText: {
    textAlign: "center"
  }
});

export default withNavigationFocus(PlaylistScreen);
