import threading
import pytest
from models import PecaPronta, MovimentacaoEstoque

def test_concurrent_stock_deduction(app, client):
    with app.app_context():
        # Get an item with initial quantity 20
        session = app.db_session
        peca = session.query(PecaPronta).filter(PecaPronta.quantidade >= 10).first()
        item_id = peca.id
        initial_qty = peca.quantidade

        # We will fire 5 concurrent deduction requests of 2 units each
        num_threads = 5
        deduct_per_thread = 2
        results = []

        def worker():
            with app.test_client() as c:
                res = c.post('/api/usar-estoque', json={
                    'categoria': 'peca',
                    'id': item_id,
                    'quantidade': deduct_per_thread
                })
                results.append(res.status_code)

        threads = [threading.Thread(target=worker) for _ in range(num_threads)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # All 5 should succeed (200)
        assert len(results) == num_threads
        assert all(code == 200 for code in results)

        # Check final quantity
        session.expire_all()
        updated_peca = session.get(PecaPronta, item_id)
        assert updated_peca.quantidade == initial_qty - (num_threads * deduct_per_thread)

def test_concurrent_overdraft_prevention(app):
    with app.app_context():
        session = app.db_session
        peca = session.query(PecaPronta).filter(PecaPronta.quantidade >= 5).first()
        peca.quantidade = 4
        session.commit()
        item_id = peca.id

        # 3 threads each requesting 2 units (Total 6 units requested, only 4 available)
        num_threads = 3
        results = []

        def worker():
            with app.test_client() as c:
                res = c.post('/api/usar-estoque', json={
                    'categoria': 'peca',
                    'id': item_id,
                    'quantidade': 2
                })
                results.append(res.status_code)

        threads = [threading.Thread(target=worker) for _ in range(num_threads)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Exactly 2 should succeed (200) and 1 should fail with 400 (insufficient stock)
        success_count = results.count(200)
        failure_count = results.count(400)
        assert success_count == 2
        assert failure_count == 1

        session.expire_all()
        final_peca = session.get(PecaPronta, item_id)
        assert final_peca.quantidade == 0
