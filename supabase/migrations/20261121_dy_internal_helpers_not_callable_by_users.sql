-- _dy_enabled() et _dy_block() sont des aides internes des fonctions de transfert (SECURITY DEFINER, qui continuent de fonctionner) :
-- un utilisateur connecté ne doit pas les appeler directement. Appliquée en production après 20261121_dy_transfer_switch.sql.
revoke all on function public._dy_enabled(), public._dy_block(text, numeric) from public, anon, authenticated;
