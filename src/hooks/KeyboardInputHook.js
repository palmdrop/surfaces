import { useEffect, useState } from "react";

export const useKeyboardInput = () => {
  const [pressedKeys, setPressedKeys] = useState({});
  const [actions, setActions] = useState({});

  const onKeyAction = (e) => {
    const key = e.key;
    const state = e.type == "keydown";

    if(state && !isHeld(key)) {
      if(actions[key]) {
        actions[key]();
      }
    }

    setPressedKeys(previous => {
      const updated = {...previous};
      updated[key] = state;
      return updated;
    });

    /*const updatedPressedKeys = {...pressedKeys};
    updatedPressedKeys[e.key] = e.type == 'keydown';
    setPressedKeys(updatedPressedKeys);
    */
  };

  const isHeld = (key) => {
    return pressedKeys[key] | false;
  }

  const onPress = (keys, action) => {
    if(Array.isArray(keys)) {
      for(const key of keys) {
        onPress(key, action);
      }
      return;
    } 
    setActions(previous => {
      const updated = {...previous};
      updated[keys] = action;
      return updated;
    });
  };


  useEffect(() => {
    window.addEventListener("keydown", onKeyAction);
    window.addEventListener("keyup", onKeyAction);

    return () => {
      window.removeEventListener("keydown", onKeyAction);
      window.removeEventListener("keyup", onKeyAction);
      setPressedKeys({});
      setActions({});
    };
  }, []);

  return [isHeld];
};