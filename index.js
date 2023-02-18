const vision = require('@google-cloud/vision');
const resource = require('./recursos'); // Codigo que ayuda a analizar los recibos linea por linea, desde el borde izquierdo al derecho
const XMLHttpRequest = require('xhr2');
const tokenManychat = 'token_manychat';
const tokenMikrowisp = 'token_mikrowisp';
const success_flow = "manychat_success_flow"; //Flujo de Manychat para recibos aprobados
const denegated_flow = "manychat_denegated_flow"; //Flujo de Manychat para recibos denegados
let recibo_recuadaciones_bp = false;
let recibo_cuenta_corriente_bp = false;
let recibo_transferencia_bp = false;
let recibo_transferencia_interna_bg = false;

function getCurrentDate() {
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    // This arrangement can be altered based on how we want the date's format to appear.
    let currentDate = `${year}${month}${day}`;
    return currentDate;
}

// Solicitud externa para enviar un flujo de mensaje a traves de Manychat
const sendFlow_manychat = (subscriber_id, flow_ns) => {
    return new Promise((resolve, reject) => {
        var url_send_flow = "https://api.manychat.com/fb/sending/sendFlow";
        var params_send_flow = { "subscriber_id": subscriber_id, "flow_ns": flow_ns }
        var xhr_sendFlow = new XMLHttpRequest();
        setTimeout(async () => {
            xhr_sendFlow.open("POST", url_send_flow);
            xhr_sendFlow.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr_sendFlow.setRequestHeader("Authorization", `Bearer ${tokenManychat}`);
            xhr_sendFlow.onreadystatechange = function () {
                if (xhr_sendFlow.readyState === XMLHttpRequest.DONE && xhr_sendFlow.status === 200) {
                    console.log(xhr_sendFlow.status);
                    console.log(xhr_sendFlow.responseText);
                }
            };
            return xhr_sendFlow.send(JSON.stringify(params_send_flow));
        }, 1500);
    })
}

// Solicitud externa para pagar factura en MIkrowisp (Sistema de administraci[on ISP])
const pagar_factura = async (num_factura, num_comprobante, tipo_comprobante, valor, subscriber_id, success_flow, denegated_flow) => {
    return new Promise((resolve, reject) => {

        var url = "https://demo.mikrosystem.net/api/v1/PaidInvoice";
        var fecha = getCurrentDate();
        var pasarela = `MAXI ${fecha}${num_comprobante}${tipo_comprobante}`;
        var params = { "token": tokenMikrowisp, "idfactura": num_factura, "pasarela": pasarela, "cantidad": valor, "idtransaccion": num_comprobante }
        var xhr_pagarFactura = new XMLHttpRequest();
        console.log("If de pagar factura");
        console.log(num_factura);
        setTimeout(async () => {
            xhr_pagarFactura.open("POST", url);
            xhr_pagarFactura.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr_pagarFactura.onreadystatechange = async function () {
                if (xhr_pagarFactura.readyState === XMLHttpRequest.DONE && xhr_pagarFactura.status === 200) {
                    console.log(xhr_pagarFactura.status);
                    console.log(xhr_pagarFactura.responseText);
                    var estado_request = JSON.parse(xhr_pagarFactura.responseText).estado;
                    if (estado_request == "exito") {
                        console.log(estado_request);
                        await sendFlow_manychat(subscriber_id, success_flow);
                    } else {
                        await sendFlow_manychat(subscriber_id, denegated_flow);
                    }
                }
            };
            return xhr_pagarFactura.send(JSON.stringify(params));
        }, 3000);
    });
}

//Conexion con el servicio Google Cloud Vision para extraer el texto de los recibos
const extraerTexto = (url_imagen, subscriber_id) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var request = require('request').defaults({ encoding: null });
            request.get(url_imagen, function (err, res, body) {
                const client = new vision.ImageAnnotatorClient({
                    keyFilename: './APIKey.json' //Extrae las credenciales y tokens de la API de Google Cloud Vision
                });
                client.textDetection(body).then(results => {
                    const textAnnotation = results[0].textAnnotations;
                    const full_text_annotation = results[0].fullTextAnnotation;
                    const a = JSON.stringify(textAnnotation);
                    const b = JSON.stringify(full_text_annotation);
                    const json_final = `[{"textAnnotations": ${a}, "fullTextAnnotation": ${b}}]`;
                    const text = JSON.parse(json_final);
                    const resultado = resource.initLineSegmentation(text[0]);
                    console.log("RESULTADO: ", resultado);
                    //Identificar recibos a traves de caracteristicas unicas de cada recibo
                    if (resultado.includes("RECAUDACIONES")) {
                        recibo_recuadaciones_bp = true;
                        console.log("ES RECAUDACIONES");
                        resolve(resultado);
                    } else if (resultado.includes("CUENTA CORRIENTE")) {
                        recibo_cuenta_corriente_bp = true;
                        console.log("ES CORRIENTE");
                        resolve(resultado);
                    } else if (resultado.includes("Transferencia exitosa")) {
                        recibo_transferencia_bp = true;
                        console.log("ES TRANSFERENCIA BP");
                        resolve(resultado);
                    } else if (resultado.includes("Guayaquil") && resultado.includes("Transferencia interna otras ctas")) {
                        recibo_transferencia_interna_bg = true;
                        console.log("ES TRANSFERENCIA BG");
                        resolve(resultado);
                    } else {
                        console.log("NO ES NINGUN RECIBO");
                        return sendFlow_manychat(subscriber_id, denegated_flow);;
                    }
                }
                )
            }
            )
        }, 1500);
    });
}

const crear_respuesta_recaudaciones_bp = (resultado) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var conjunto = {};
            for (let i = 0; i < resultado.length; i++) {
                if (resultado[i].includes("Cliente")) {
                    const nombreCliente = resultado[i].split(": ")[1];
                    conjunto["nombreCliente"] = nombreCliente;
                }
                if (resultado[i].includes("Empresa") || resultado[i].includes("Enpresa")) {
                    const nombreEmpresa = resultado[i].split(": ")[1];
                    conjunto["nombreEmpresa"] = nombreEmpresa;
                }
                if (resultado[i].includes("Valor")) {
                    const valorCliente = resultado[i].split(" ")[1];
                    conjunto["valorCliente"] = valorCliente;
                }
                if (resultado[i].includes("Control")) {
                    const controlCliente = resultado[i].split(" ")[1];
                    conjunto["controlCliente"] = controlCliente;
                }
                if (resultado[i].includes("Documento") || resultado[i].includes("Docunento")) {
                    const documentoCliente = resultado[i].split(" ")[1];
                    conjunto["documentoCliente"] = documentoCliente;
                }
            }
            resolve(conjunto);
        }, 500)
    })
}

const crear_respuesta_corriente_bp = (resultado) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var conjunto = {};
            for (let i = 0; i < resultado.length; i++) {
                if (resultado[i].includes("Nombre")) {
                    const nombreEmpresa = resultado[i].split(": ")[1];
                    conjunto["nombreEmpresa"] = nombreEmpresa;
                }
                if (resultado[i].includes("Efectivo")) {
                    const valorCliente = resultado[i].split(" ")[1];
                    conjunto["valorCliente"] = valorCliente;
                }
                if (resultado[i].includes("Control")) {
                    const controlCliente = resultado[i].split(" ")[1];
                    conjunto["controlCliente"] = controlCliente;
                }
                if (resultado[i].includes("Documento")) {
                    const documentoCliente = resultado[i].split(" ")[1];
                    conjunto["documentoCliente"] = documentoCliente;
                }
            }
            resolve(conjunto);
        }, 500)
    })
}

const crear_respuesta_transferencia_bp = (resultado) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var conjunto = {};
            for (let i = 0; i < resultado.length; i++) {
                if (resultado[i].includes("Beneficiario")) {
                    const nombreEmpresa = resultado[i].split(": ")[1];
                    conjunto["nombreEmpresa"] = nombreEmpresa;
                }
                if (resultado[i].includes("Has transferido") || resultado[i].includes("Has $") || resultado[i].includes("$")) {
                    const valorCliente = resultado[i].split("$")[1];
                    conjunto["valorCliente"] = valorCliente;
                }
                if (resultado[i].includes("Nro. comprobante") || resultado[i].includes("Nro. Comprobante")) {
                    const controlCliente = resultado[i].split(":")[1];
                    conjunto["controlCliente"] = controlCliente.trim();
                }
                if (resultado[i].includes("Email") || resultado[i].includes("Correo")) {
                    const emailCliente = resultado[i].split(":")[1];
                    conjunto["emailCliente"] = emailCliente.trim();
                }
            }
            resolve(conjunto);
        }, 500)
    })
}

const crear_respuesta_transferencia_interna_bg = (resultado) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            var conjunto = {};
            for (let i = 0; i < resultado.length; i++) {
                if (resultado[i].includes("No.")) {
                    const controlCliente = resultado[i].split(".")[1];
                    conjunto["controlCliente"] = controlCliente;
                }
                if (resultado[i].includes("Valor debitado")) {
                    const valorCliente = resultado[i].split("$")[1];
                    conjunto["valorCliente"] = valorCliente;
                }
                if (resultado[i].includes("No.")) {
                    const nombreCliente = resultado[i + 5];
                    conjunto["nombreCliente"] = nombreCliente;
                }
                if ((resultado[i].includes("Turbonet SA") || resultado[i].includes("Turbonet S A") && resultado[i + 1].includes("3XXX8493"))) {
                    const nombreEmpresa = resultado[i];
                    conjunto["nombreEmpresa"] = nombreEmpresa;
                }
            }
            resolve(conjunto);
        }, 500)
    })
}

async function verificarPago(url_imagen, subscriber_id, numero_factura, total_factura) {
    try {
        console.log("Entra a verificar pago");
        const resultado = await extraerTexto(url_imagen, subscriber_id);
        console.log("Pasa extraer texto");

        if (recibo_recuadaciones_bp == true) {
            const respuesta_recaudaciones_bp = await crear_respuesta_recaudaciones_bp(resultado);
            console.log(respuesta_recaudaciones_bp);
            if (Object.keys(respuesta_recaudaciones_bp).length == 5 && respuesta_recaudaciones_bp.nombreEmpresa.includes("TURBONET") && respuesta_recaudaciones_bp.valorCliente == total_factura) {
                console.log("Entro al if R");
                await pagar_factura(numero_factura, respuesta_recaudaciones_bp.documentoCliente, "-DEPOSITO_RECAUDACIONES_PCH", respuesta_recaudaciones_bp.valorCliente, subscriber_id, success_flow, denegated_flow);
            } else {
                console.log("NO entro al if R");
                return sendFlow_manychat(subscriber_id, denegated_flow);
            }
        }

        // VALIDAR RECIBOS DE CUENTA CORRIENTE BP
        if (recibo_cuenta_corriente_bp == true) {
            const respuesta_corriente_bp = await crear_respuesta_corriente_bp(resultado);
            if (Object.keys(respuesta_corriente_bp).length == 4 && respuesta_corriente_bp.nombreEmpresa.includes("TURBONET") && respuesta_corriente_bp.valorCliente == total_factura) {
                console.log("Entro al if C");
                await pagar_factura(numero_factura, respuesta_corriente_bp.documentoCliente, "-DEPOSITO_CORRIENTE_PCH", respuesta_corriente_bp.valorCliente, subscriber_id, success_flow, denegated_flow);
            } else {
                console.log("NO entro al if C");
                return sendFlow_manychat(subscriber_id, denegated_flow);
            }
        }

        // VALIDAR TRANSFERENCIAS BP
        if (recibo_transferencia_bp == true) {
            const respuesta_transferencia_bp = await crear_respuesta_transferencia_bp(resultado);
            console.log(respuesta_transferencia_bp);
            if (Object.keys(respuesta_transferencia_bp).length == 4 && respuesta_transferencia_bp.nombreEmpresa.includes("Turbonet") && respuesta_transferencia_bp.valorCliente == total_factura) {
                console.log("Entro al if TP");
                await pagar_factura(numero_factura, respuesta_transferencia_bp.controlCliente, "-TRANSFERECIA_PCH", respuesta_transferencia_bp.valorCliente, subscriber_id, success_flow, denegated_flow);
            } else {
                console.log("NO entro al if TP");
                return sendFlow_manychat(subscriber_id, denegated_flow);
            }

        }

        // VALIDAR TRANSFERENCIAS INTERNA BG
        if (recibo_transferencia_interna_bg == true) {
            const respuesta_transferencia_interna_bg = await crear_respuesta_transferencia_interna_bg(resultado);
            console.log(respuesta_transferencia_interna_bg);
            if (Object.keys(respuesta_transferencia_interna_bg).length == 4 && respuesta_transferencia_interna_bg.valorCliente == total_factura) {
                console.log("Entro al if TG");
                await pagar_factura(numero_factura, respuesta_transferencia_interna_bg.controlCliente, "-TRANSFERECIA_GYE", respuesta_transferencia_interna_bg.valorCliente, subscriber_id, success_flow, denegated_flow);
            } else {
                console.log("NO entro al if TG");
                return sendFlow_manychat(subscriber_id, denegated_flow);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

//Conexion con AWS Lambda
exports.handler = async (event) => {
    const promise = new Promise((resolve, reject) => {
        console.log("Entra al handler");
        try {
            setTimeout(() => {
                resolve(verificarPago(event['url_imagen'], event['subscriber_id'], event['num_factura'], event['valor_factura']));
            }, 2000)            
        } catch (e) {
            console.log("Ha existido un error en SYNC AWAIT");
            console.log(e);
            reject(Error(e));
        }
    });
    return promise;
}

//verificarPago(url_transferencia_bg_2, 26269252, 1038, "25.00");