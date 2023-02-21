<h1 align="center">Lectura de recibos con Inteligencia Artificial</h1>
<p align="center">
    <img alt="Chatbot" title="Chatbot" src="https://raw.githubusercontent.com/edwin06111998/reconocer_recibos_AWS/main/imagenes/Captura%20desde%202023-02-17%2023-19-55.png" width="250">
    <img alt="Chatbot" title="Chatbot" src="https://raw.githubusercontent.com/edwin06111998/reconocer_recibos_AWS/main/imagenes/Captura%20desde%202023-02-17%2023-22-12.png" width="250">
  </a>
</p>

<p align="center">
  Lector de recibos usando la API de Google Cloud Vision.
</p>

## Tabla de contenidos

- [Introducción](#introduction)
- [Funciones](#features)
- [Retroalimentación](#feedback)
- [Contribuidores](#contributors)
- [Proceso de construcción](#build-process)
- [Contacto](#acknowledgments)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Introducción

Lector de recibos o vóuchers de las principales entidades bancarias del Ecuador. El sistema reconoce el tipo de recibo, valida campos específicos como el número de control, el valor del recibo, el destinatario, útil para validar pagos en diferentes sistemas.

**Código válido para implementar en el servicio de AWS Lambda.**

<p align="center">
  <img src = "https://raw.githubusercontent.com/edwin06111998/reconocer_recibos_AWS/main/imagenes/recibo.png" width=500>
  <img src = "https://raw.githubusercontent.com/edwin06111998/reconocer_recibos_AWS/main/imagenes/respuesta.png" width=500>
</p>

## Funciones

Estas son algunas de las características del lector de recibos:

* Identifica características claves de los recibos.
* Identifica el tipo de recibo.
* Obtiene el valor del recibo, número de control, destinatario.
* Se puede reprogramar para identificar otras características claves.
* Lee imágenes de cualquier formato y resolución.
* Capaz de leer imágenes volteadas.
* Puede procesar múltiples transacciones simultáneamente en cola.

<p align="center">
  <img src = "https://raw.githubusercontent.com/edwin06111998/reconocer_recibos_AWS/main/imagenes/seleccionar_pago.png" width=300>
  &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp
  <img src = "https://raw.githubusercontent.com/edwin06111998/reconocer_recibos_AWS/main/imagenes/pago%3Fexito.png" width=300>
</p>

## Retroalimentación

Siéntete libre de comentarme tu experiencia utilizando este sistema, puedes escribir al siguiente correo: edwin06111998@gmail.com. Tus comentarios son importantes para seguir haciendo robusto este sistema.

## Contribuidores

Este proyecto ha sido desarrollado únicamente por mí (Edwin Veloz).

## Proceso de construcción

- Clona o descarga el repositorio
- Crea una función lambda en AWS.
- Completa el archivo APIKey.json con los datos de tu servicio Cloud Vision de Google.
- Sube el código como archivo comprimido a la función Lambda
- Ahora estarás listo para leer recibos.

## Contacto

- LinkedIn: www.linkedin.com/in/edwin-veloz-2153a9137
- Correo: edwin06111998@gmail.com
