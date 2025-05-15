import { React } from "react";
import { Handle } from "@xyflow/react";

export default function Terminal(props) {
    return (
        <Handle 
            style={{
                width: 8,
                height: 8,
                background: "white",
                border: "1px solid black",
            }}
            {...props}
        />
    );
}