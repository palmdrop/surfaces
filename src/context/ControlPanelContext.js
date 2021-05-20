import { useContext, useState, createContext } from 'react'

const ControlPanelContext = createContext();
const ControlPanelUpdateContext = createContext(); 

export const useControlPanelContext = () => {
    return useContext(ControlPanelContext);
}

export const useControlPanelUpdateContext = () => {
    return useContext(ControlPanelUpdateContext);
}

export const ControlPanelContextProvider = ({ children }) => {
    const [activeCategory, setActiveCategory] = useState(null);
    const [categoryData, setCategoryData] = useState(null);
    const [hoverLocation, setHoverLocation] = useState(null);

    const updateActiveCategory = (category, data) => {
        setActiveCategory(category);
        setCategoryData(data);
    };

    return (
        <ControlPanelContext.Provider value={[activeCategory, categoryData, hoverLocation]}>
            <ControlPanelUpdateContext.Provider value={[updateActiveCategory, setHoverLocation]}>
                {children}
            </ControlPanelUpdateContext.Provider>
        </ControlPanelContext.Provider>
    );
}
