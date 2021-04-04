import TXC from '../context/TextureController'
import useStateEffect from './StateEffectHook'

const useTXCState = (name, defaultState) => {
    const [state, setState] = useStateEffect(defaultState, 
        () => TXC.updateValue(name, state)
    );
    return [state, setState];
}

export default useTXCState
