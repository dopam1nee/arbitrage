const readline = require('readline')
const chalk = require('chalk')
const Table = require('cli-table3')
const { CURRENCIES: CUR } = require('./constants/currencies')

// Создаём интерфейс для чтения ввода с консоли
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

// Функция для запроса данных у пользователя и выполнения расчётов
const askQuestion = query => {
	return new Promise(resolve => rl.question(query, resolve))
}

// Основная функция расчёта
const calculateProfit = async () => {
	// Запрашиваем данные у пользователя
	const purchaseRub = parseFloat(
		await askQuestion(chalk.yellow(`\nВведите сумму закупа (${CUR.RUB}) (Bybit): `)),
	)
	const usdtRateBb = parseFloat(
		await askQuestion(
			chalk.magentaBright(`Введите курс (${CUR.RUB}-${CUR.USDT}) (Bybit): `),
		),
	)
	const coin = await askQuestion(
		chalk.yellow(`Выберите монету (${CUR.TON}/${CUR.NOT}/${CUR.USDT}): `),
	).then(coin => {
		if (Number(coin)) {
			return Number(coin) === 1
				? (coin = CUR.TON)
				: Number(coin) === 2
				? (coin = CUR.NOT)
				: (coin = CUR.USDT)
		} else {
			return coin.toUpperCase() || CUR.USDT
		}
	})

	// Определяем комиссию для выбранной монеты
	let fee = 0
	switch (coin) {
		case CUR.TON:
			fee = 0.1
			break
		case CUR.NOT:
			fee = 100
			break
		case CUR.USDT:
			fee = 0.3
			break
		default:
			console.error('Неизвестная монета')
			rl.close()
			return
	}

	let coinRateBb
	coin === CUR.USDT
		? (coinRateBb = 1)
		: (coinRateBb = parseFloat(
				await askQuestion(
					chalk.magentaBright(`Введите курс монеты (${CUR.USDT}-${coin}) (Bybit): `),
				),
		  ))

	const coinRateTg = parseFloat(
		await askQuestion(
			chalk.magentaBright(
				`Введите курс монеты (${CUR.RUB}-${coin}) (Telegram Wallet): `,
			),
		),
	)

	// Шаги для вычисления результата
	let usdtBb = purchaseRub / usdtRateBb // покупаем USDT
	let coinAmount = usdtBb / coinRateBb // конвертируем в монету по курсу Bybit
	coinAmount -= fee // вычитаем комиссию

	const rubAmount = coinAmount * coinRateTg // пересчитываем по курсу Telegram Wallet

	// Вычисление прибыли и процента прибыли
	const profit = rubAmount * 0.991 - purchaseRub // прибыль в рублях
	const percentageProfit = (profit / purchaseRub) * 100 // процентная прибыль

	// Формирование таблицы
	const table = new Table({
		head: [chalk.white('Описание'), chalk.white('Значение')],
		colWidths: [40, 20],
	})

	// Добавляем данные в таблицу, применяя стили для текста
	table.push(
		['Монета', chalk.blueBright(coin)],
		[
			profit > 0 ? `Прибыль (${CUR.RUB})` : `Убыток (${CUR.RUB})`,
			profit > 0
				? chalk.greenBright(profit.toFixed(2))
				: chalk.redBright(profit.toFixed(2)),
		],
		[
			'Спред (%)',
			percentageProfit > 0
				? chalk.greenBright(percentageProfit.toFixed(2))
				: chalk.redBright(percentageProfit.toFixed(2)),
		],
		[`Сумма закупа (${CUR.RUB}) (Bybit)`, chalk.yellow(`${purchaseRub}`)],
		[`Курс (${CUR.RUB}-${CUR.USDT}) (Bybit)`, chalk.magentaBright(usdtRateBb)],
		[`Количество закупа (${CUR.USDT})`, chalk.yellow(usdtBb.toFixed(2))],
		[`Курс (${CUR.USDT}-${coin}) (Bybit)`, chalk.magentaBright(coinRateBb)],
		[`Количество монет (${coin})`, chalk.yellow(coinAmount.toFixed(2))],
		[`Курс (${CUR.RUB}-${coin}) (Telegram Wallet)`, chalk.magentaBright(coinRateTg)],
	)

	// Выводим таблицу
	console.log(`\n${table.toString()}`)

	rl.close() // Закрываем интерфейс ввода
}

// Запускаем функцию
calculateProfit()

// Пример использования

// 20000
// 99.2
// ton
// 5.39
// 559.89
