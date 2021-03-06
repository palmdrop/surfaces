import { useContext, useState, useRef, createContext } from 'react'

const ControlPanelContext = createContext();
const ControlPanelUpdateContext = createContext(); 

const SetHoverCallbackContext = createContext();
const UpdateHoverContext = createContext();

export const useControlPanelContext = () => {
    return useContext(ControlPanelContext);
}

export const useControlPanelUpdateContext = () => {
    return useContext(ControlPanelUpdateContext);
}

export const useSetHoverCallbackContext = () => {
    return useContext(SetHoverCallbackContext);
}

export const useUpdateHoverContext = () => {
    return useContext(UpdateHoverContext);
}

// Context for control panel
// Keeps track of active categories, category data, and hover locations
export const ControlPanelContextProvider = ({ children }) => {
    const [activeCategory, setActiveCategory] = useState(null);
    const [categoryData, setCategoryData] = useState(null);
    const callback = useRef(null);

    const updateHoverLocation = (hoverLocation, description) => {
        callback.current && callback.current(hoverLocation, description);
    };

    const updateActiveCategory = (category, data) => {
        setActiveCategory(category);
        setCategoryData(data);
    };

    const setHoverCallback = (cb) => {
        //setCallback({callback});
        callback.current = cb;
    };

    return (
        <ControlPanelContext.Provider value={[activeCategory, categoryData]}>
            <ControlPanelUpdateContext.Provider value={[updateActiveCategory]}>
                <SetHoverCallbackContext.Provider value={setHoverCallback}>
                    <UpdateHoverContext.Provider value={updateHoverLocation}>
                        {children}
                    </UpdateHoverContext.Provider>
                </SetHoverCallbackContext.Provider>
            </ControlPanelUpdateContext.Provider>
        </ControlPanelContext.Provider>
    );
}
