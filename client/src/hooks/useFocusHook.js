import { useRef } from "react"


/*

    * Este codigo es useFocus es para cuando no utilizo 
    * MATERIAL UI \\ MUI

   export const useFocus = () => {
    
        const htmlElRef = useRef(null)
        const setFocus = () => {htmlElRef.current && htmlElRef.current.focus()}

        return [ htmlElRef, setFocus ]
    }
*/


// ESTE SI ES PARA CUANDO UTILIZO MUI

export const useFocus = () => {
    const htmlElRef = useRef(null);
    const setFocus = () => {
        if (htmlElRef.current) {
            // Usar focus directamente en el elemento MUI
            htmlElRef.current.focus();
        }
    };
    return [htmlElRef, setFocus];
};