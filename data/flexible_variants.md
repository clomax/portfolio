[Code](https://github.com/clomax/spree_flexible_variants)

This is an extension for Spree commerce that enables inventory management of
products that are cut to order (e.g. fabric).

*Spree flexible variants* was originally created for
[*shop.cwilt.co.uk*](https://shop.cwilt.co.uk), an online quilting fabric and
haberdashery shop that I built and maintain.

The merchant wanted to cut four different shapes of fabric from a bolt (thin
quarter, fat quarter, half metre and metre), but Spree does not provide the
means to express stock in this way. So I created this extension to solve that issue.

![Stock Management page of a product showing that its stock is counted in units](assets/images/flexible_variants/admin.png =700x)

Each product has the option, *Flexible Variants*, to sell variants at different
sized cuts. The number of flexible units is the total number of the smallest
size you can sell.

From a 10m bolt of fabric:

| Size | Units |
|------|-------:|
|Thin quarter | 1 |
|Fat quarter | 1 |
|Half metre | 2 |
|Metre | 4 |

There are forty quarter metres in ten metres, therefore the total number of
units is 40.

![Product page showing what happens when there's not enough stock to proceed with an order](assets/images/flexible_variants/not_enough_stock.png)

The extension also affects the customer facing front-end. The total number of
units remaining, and the unit amount for each variant, is shown. When the
customer tries to enter a combination of variant and quantity that is higher
than the total number of units the button is disabled, turns red, and reads
*"Not Enough Stock"*.

