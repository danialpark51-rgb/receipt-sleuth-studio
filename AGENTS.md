<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Every child table (receipt_items, audit_results, investigation_evidence, price_checks) carries user_id plus a composite FK (parent_id, user_id) to its parent; why: the database itself blocks linking rows to another user's receipt or case.
- Receipt files live in the private `receipt-files` bucket under `<user_id>/...`; why: storage policies match the first folder to auth.uid().
