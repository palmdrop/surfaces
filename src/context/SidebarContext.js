import { useContext, useState, createContext } from 'react'

const SidebarContext = createContext();
const SidebarUpdateContext = createContext(); 

export const useSidebarContext = () => {
    return useContext(SidebarContext);
}

export const useSidebarUpdateContext = () => {
    return useContext(SidebarUpdateContext);
}

export const SidebarContextProvider = ({ children }) => {
    const [categoryExpanded, setCategoryExpanded] = useState({});
    const [activeCategory, setActiveCategory] = useState({ name: null, choice: null });
    const [activeCategoryData, setActiveCategoryData] = useState(null);

    const updateCategoryExpanded = (name, action) => {
        const isExpanded = categoryExpanded[name];

        let expanded;

        switch(action) {
            case "toggle":   expanded = !isExpanded; break;
            case "expand":   expanded = true;        break;
            case "contract": expanded = false;       break;
            default:         return;
        }

        setCategoryExpanded({
            ...categoryExpanded,
            [name]: expanded
        });
    };

    const updateActiveCategory = (name, choice, data) => {
        setActiveCategory({
            choice: choice,
            name: name
        });

        name && setActiveCategoryData(data);
    }

    return (
        <SidebarContext.Provider value={[categoryExpanded, activeCategory, activeCategoryData]}>
            <SidebarUpdateContext.Provider value={[updateCategoryExpanded, updateActiveCategory]}>
                {children}
            </SidebarUpdateContext.Provider>
        </SidebarContext.Provider>
    );
}
