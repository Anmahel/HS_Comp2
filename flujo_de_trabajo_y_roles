creacion de roles y flujo de trabajo:
1 -flujo de trabajo de agatha:
    -Rol = Soporte:
    -Flujo de Trabajo
        A) ella recibe las camisas que han sido devolvidas 
            y las lleva para el almacen, 
            como es la del soporte ella tambien se encarga de 
            cargar las plantillas de separacion que estan 
            en la pagina , ella descarga esas planillas en PDF
            despues de las descarga se las entrega a separacion 
            y al chico de la impresora , 
            este PDF, contiene el SKU, la cantida de pedido,
            la cantida de esa camisa , la fecha , 
            el produnco y una imagen del producto ,  
            
            AA) que el producto cuenta con el nombre de la banda el tamaño, el color , genero y la marca
                
    -Problemas
        B) ella no sabe  cuantas camisas se van a tener que hacer en tal 
           dia concreto ya que solo cuenta con la cantidad de los pedidos,
    -Objetivos
        C) poder montar el PDF al sistema,
           saber la cantidad de camisas de tal dia,
           que pueda interactuar con esos datos como:
            saber que tal dia se realizo tantos pedidos 
            saber el total de camisas y sueter de tal dia
            tener un registo de los PDF montados como es 
            hora y dia , 
           CC) el sistema ahora tiene que sacar 2 PDF 
               uno para separacion y otro para el chico de la impresora
               el PDF de separacion tendra las camisas o estampas que 
               tienen que buscar en el almacen , y el PDF del chico 
               de la impresora tendra las demas estampas que hacen falta
    -Resolver
        D) que la separacion sea mas rapida
           que la impresora no imprima mas de la cuenta o cosas que no sean necesarias 
           
    -Beneficios
        E) control y organizacion en la busquedas de datos, referentes a los pedidos 
           la separacion es mas rapidad,
    -Notas: ella no almacenan las camisas ni las estampas 
            solo es la que sacas las planillas en PDF 
            para entregarselas a separacion y al chico de la impresora,
            ella no puede borrar los PDF (los datos relacionados) si lo quiere eliminar 
            primero tendra que decir el motivo y despues el sistema le dira que confirme la accion 
            si prosede a elimina ese registro del PDF pero la nota de porque lo elimino quedara 
            para que lo pueda ver el toma decisiones. 
            los PDF no pueden ser editados, 
            los datos del PDF solo son para tener un registro y control de los pedidos 
            y poder crear los nuevos 2 PDF para facilitar la busqueda de separacion 
            y evitar que la impresora trabaje de mas.
     -Nota 2:
            un flujo importante , sabiendo que cuando el rol de Soporte monte el PDF y 
            el sistema comiense a realizar el proseso de busqueda y de la creacion de los nuevos PDF 
            tenemos que tener muy en claro que es lo que tendra estos nuevos PDF.
            *PDF 1: este es el que se le invia al chico de la impresora y a separacion ,
                    este PDF cuenta con la caracteristica de que ya fuero restadas o eliminadas los
                    pedidos que ya no ara , por ejemplo:
                        si en el PDF original estaba la camisa 
                        * (producto = camiseta Baby Look Feminina Un Belo Dia Ria - G - Preta)(codigo SKU = CF-643-PRE-G) (cantida = 2) * 
                        y el el almace tiene 1 , entonces en el nuevo PDF 1 se tiene que restar una camisa a la cantidad, dejando 
                        la cantida en 1 dejando el nuevo PDF de este modo 
                        (producto = camiseta Baby Look Feminina Un Belo Dia Ria - G - Preta)(codigo SKU = CF-643-PRE-G) (cantida = 1)
             *PDF 2: este es tambien enviado a separacion pero solo tendra las camisas o las estampas que tendan que buscar en el almacen 
                    por ejemplo si al PDF  se le resto 1 camisas del
                     (producto = camiseta Baby Look Feminina Un Belo Dia Ria - G - Preta)(codigo SKU = CF-643-PRE-G) (cantida = 2)
                     eso quiere decir que el PDF 1 tiene 1 y la otra estara en el PDF 2
                     otro ejemplo:
                     (producto = Camiseta Masculina 78 Black Sabbath - P - Branca)(codigo SKU = CM-001-BRA-P) (cantida = 5)
                     (producto = Camiseta Masculina Un Belo Dia Ria - G  - Preta)(codigo SKU = CM-643-PRE-G) (cantida = 2)
                     (producto = camiseta Baby Look Feminina Un Belo Dia Ria - GG - Preta)(codigo SKU = CF-643-PRE-GG) (cantida = 1)
                     (producto = camiseta Baby Look Feminina Toca Raul - M - Branca)(codigo SKU = CF-558-BRA-M) (cantida = 10)
                     (producto = Camiseta Masculina Tour Guns 2025 - M - Branca)(codigo SKU = CF-572-BRA-M) (cantida = 10)
                     y el es almacen tengo 
                     camisas listas:
                        CM-001-BRA-P = 0
                        CM-643-PRE-G = 1
                        CF-643-PRE-GG = 1
                        CF-558-BRA-M = 0 
                     estampas:
                        572-BRA = 5 estapas
                     el nuevo PDF 1 seria 
                            (producto = Camiseta Masculina 78 Black Sabbath - P - Branca)(codigo SKU = CM-001-BRA-P) (cantida = 5)
                            (producto = Camiseta Un Belo Dia Ria - G  - Preta)(codigo SKU = CM-643-PRE-G) (cantida = 1)
                            (producto = camiseta Baby Look Feminina Toca Raul - M - Branca)(codigo SKU = CF-558-BRA-M) (cantida = 10)
                            (producto = Camiseta Masculina Tour Guns 2025 - M - Branca)(codigo SKU = CF-572-BRA-M) (cantida = 5)
                     y el nuevo PDF 2 seria:
                            (producto = Camiseta Un Belo Dia Ria - G  - Preta)(codigo SKU = CM-643-PRE-G) (cantida = 1)
                            (producto = camiseta Baby Look Feminina Un Belo Dia Ria - GG - Preta)(codigo SKU = CF-643-PRE-GG) (cantida = 1)
                            (producto = Tour Guns 2025 - M - Branca)(codigo SKU = 572-BRA) (cantida = 5)
2 -flujo de trabajo de Separacion:
    -Rol = Separacion:
    -Problemas
        A) se tardan en buscar las prendas y las estampas 
    -Flujo de Trabajo
        B) cuando agata le da el PDF separacion tiene que buscar en X cantida de pedidos 
           si tal camisa esta ya en el almazen o si por lo menos esta la estampa 
           si esta la estampa o la camisa tiene que tachar o restar esas camisas 
           al PDF, despues de hacer eso le entregan el PDF al chico de la impresora 
           para que el pueda imprimir las estampas que faltan .
           separacion se puede decir que tambien registra las camisas que trajo agata 
           pero las estampas si las tiene que registrar es decir ellas tienen 
           un micro sistema en papel y mental de las estampas que tiene para agilizar 
           el proseso de busqueda,
    -Objetivos
        C) hacer que separacion sea mas rapido y productivo 
           hacer que el micro sistema mental y de papel sea eficiente,
           duradero, rentable, fiable, trasparente y lo mas exacto posible
           
    -Resolver
        D) la lentitud de la separacion y agilizar el proceso   
    -Beneficios
        E) pasar el micro sistema al sistema que se creara,
           aumentar la velocidad de busqueda de las estampas y de las camisas 
           
    -Nota:
3 -
    -Rol = General:
    -Problemas 
        A) la tardansa de buscar una camisa y el contro de las camisas que trajo agata
    -Flujo de Trabajo
        B) despues que agata trae las camisas cualquier personal de la compañia ,
           puede verificar el estado de la camisas para ver si el estado esta bien 
           para poder ser envalada de nuevo y tenerla en el armazen hasta que se requiera 
    -Objetivos
        C) poder agilizar la busqueda de una camisas lista 
           y reguistra la entrada de esa camisa
    -Resolver
        D) la tardansa de busqueda y la lentitud  
    -Beneficios
        E) tener contro de las camisas listas 
           poder saber con rapides que camisas tienes en el almacen 
           poder guardar y registra y usar las camisas listas 
           
    -Nota: puede ver las camisas y tambien puede editar todo lo que tiene que ver con las camisas 
           como es usar y editar y agregar . 
    
    
4 -
    -Rol = jefe:
    -Problemas 
        A)  no cuenta con un sistema automatizado
    -Flujo de Trabajo
        B) no tiene un flujo
    -Objetivos
        C) crear un sitema
    -Resolver
        D) la falta de informacion
    -Beneficios
        E) un sistema que controla todo lo que tiene que ver con el flujo de trabajo de la compañia , dividido en 5 usuario 
           con el usuario jefe podra por los monentos  tener un sistema de toma de deciciones , que le facilitara 
           saber las camisas que tiene en el inventario , 
           saber las estampas que tiene en el inventario
           saber que camisas es la mas vendida 
           que color , que talla , que genero , 
           que banda vende mas , que marca vende mas 
           que dia tiene mas ventas (pedido),
           que mes a tenido mas ventas , 
           que año fue el mejor , 
           
           
    -Nota: 
        ABC) una mejora si se tiene la hora de los pedidos para saber tambien a que hora del dia la gente compar mas 
    
4 -
    -Rol = ING:
    -Problemas
        A) no tiene 
    -Flujo de Trabajo
        B) no tiene 
    -Objetivos
        C) saber que hacen los otros usuarios
    -Resolver
        D) dicrepasia en el sistema 
    -Beneficios
        E) facilidad de introducir datos sensibles al sistema 
           como puede ser , otra marcas , el reguistro de log de los otro usuario y de actividad
           (Log de Auditoria e Movimentações)
           nuevos tamaños de camisas , nuevos colores , nuevos usuarios, nuevos roles ,  
           


    
    
    
    prompt por la ia
    
    Por favor, toma las siguientes especificaciones de negocio para el proyecto HC_comp y genera una planificación paso a paso de tareas de desarrollo backend y frontend, seguida de la implementación del código:

### Módulo: Procesamiento de Pedidos, Descuento de Stock y RBAC

1. Endpoints de Ingesta y Parsing:
   - Crear endpoint POST /api/pedidos/procesar que acepte archivos CSV, XLSX o PDF.
   - Extraer: SKU, Producto, Cantidad, Fecha, Imagen/URL.
   - Implementar la lógica de SKU para prendas (CF-643-PRE-G) y estampas (643-PRE).

2. Transacción de Inventario (Descuento Atómico):
   - Consultar 'pecas_prontas' y descontar stock disponible en el momento.
   - Consultar 'estampas' para las unidades restantes y descontar stock disponible.
   - Calcular el remanente exacto que requiere impresión.

3. Generación de PDFs y Envíos:
   - Generar PDF 1 (Imprenta): Solo ítems que requieren impresión. Integrar hooks para envío por WhatsApp/Email.
   - Generar PDF 2 (Separación): Solo ítems o estampas descontadas a retirar del almacén.

4. Auditoría y Eliminación de Lotes:
   - Implementar soft delete para lotes de pedidos procesados.
   - Requerir campo 'motivo' obligatorio al cancelar.
   - Revertir el stock descontado al cancelar un lote y registrar el movimiento en 'auditoria_movimientos'.

Genera la hoja de ruta con los archivos a crear/modificar en Flask (backend) y React (frontend) antes de escribir el código.
    
    
    
    
    
    