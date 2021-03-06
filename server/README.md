## Серверная часть CI
Список сборок хранится локально в директории [builds](./data/builds) которая выполняет роль хранилища артефактов.

- Сервер генерирует уникальные номера сборок.

При запуске процесса генерируется новый id, который присваивается сборке. В данный момент используется собственная заглушка,
которая имеет ряд недостатков (напрмиер коллизии), но в данном решении подходит.
 
- Сервер максимально утилизирует имеющихся агентов.

При регистрации нового агента у него проставляется статус `busy: false`. Как только агент начинает работу, статус
 меняется на `busy: true`. После завершения билда агент снова приобретает статус `busy: false`
- Сервер должен корректно обрабатывает ситуацию, когда агент прекратил работать между сборками.

Если агент не доступен ошибка прокидывается пользователю и сообщает, что агенты не доступны.

- Сервер должен корректно обрабатывать ситуацию, когда агент прекратил работать в процессе выполнения сборки.

Если агент упал во время сборки, то билд переходит в статус 'FAILED'
- Сервер должен корректно обрабатывать ситуацию, когда агенты не справляются с поступающими заявками.

В данный момент просто появляется сообщение что нет свободных агентов и сборка невозможна. Теоретически можно сделать 
что-то вроде очереди сборок и по мере освобождения агентов брать сборку из очереди. Сейчас не успеваю это сделать. 

## UI

Доступен пользовательский интерфейс.
1. Страница ввода хеша коммита, команды и кнопки запуска. Со списком всех сборок и их статусами.
2. Странца сборки. Достуны хеш коммита, статус, время начала/окончания сборки и логи.