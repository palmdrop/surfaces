import {useState, useEffect } from 'react'

const useStateEffect = (defaultState, effect, cleanup = null) => {
    const [state, setState] = useState(() => defaultState);
    useEffect(() => {
        effect();
        return () => {
            if(cleanup) cleanup();
        }
    }, [state, effect, cleanup])

    return [state, setState];
}

export default useStateEffect
